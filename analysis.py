import html
import json
import os
import re
import numpy as np
import pandas as pd

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
CSV_PATH = os.path.join(BASE_DIR, "vendas.csv")
JS_OUT_PATH = os.path.join(BASE_DIR, "static", "js", "dados.js")
HTML_PATH = os.path.join(BASE_DIR, "index.html")


def carregar_dados() -> pd.DataFrame:
    df = pd.read_csv(CSV_PATH, parse_dates=["data_venda"])
    df["mes_ano"] = df["data_venda"].dt.to_period("M")
    return df


def kpis_gerais(df: pd.DataFrame) -> dict:
    return {
        "faturamento_total": round(float(df["faturamento_usd"].sum()), 2),
        "total_pedidos":     int(df["id_pedido"].nunique()),
        "produtos_vendidos": int(df["quantidade"].sum()),
        "ticket_medio":      round(float(df["faturamento_usd"].mean()), 2),
        "num_vendedores":    int(df["vendedor"].nunique()),
        "num_regioes":       int(df["regiao"].nunique()),
    }


def tabela_vendas(df: pd.DataFrame) -> list[dict]:
    cols = [
        "id_pedido", "data_venda", "produto",
        "quantidade", "preco_unitario_usd",
        "total_venda_usd", "faturamento_usd",
        "regiao", "vendedor",
    ]
    resultado = df[cols].copy()
    resultado["data_venda"] = resultado["data_venda"].dt.strftime("%d/%m/%Y")
    resultado["preco_unitario_usd"] = resultado["preco_unitario_usd"].round(2)
    resultado["total_venda_usd"]    = resultado["total_venda_usd"].round(2)
    resultado["faturamento_usd"]    = resultado["faturamento_usd"].round(2)
    return resultado.to_dict(orient="records")


def tabela_produtos(df: pd.DataFrame) -> list[dict]:
    grp = (
        df.groupby("produto", as_index=False)
        .agg(
            quantidade_vendida=("quantidade", "sum"),
            faturamento=("faturamento_usd", "sum"),
        )
        .sort_values("faturamento", ascending=False)
        .reset_index(drop=True)
    )
    grp["faturamento"] = grp["faturamento"].round(2)

    total = len(grp)
    top_n = max(1, round(total * 0.3))
    low_n = max(1, round(total * 0.3))

    def status(rank: int) -> str:
        if rank < top_n:
            return "top"
        if rank >= total - low_n:
            return "low"
        return "mid"

    grp["status"] = [status(i) for i in range(total)]
    grp.insert(0, "ranking", range(1, total + 1))
    return grp.to_dict(orient="records")


def tabela_vendedores(df: pd.DataFrame) -> list[dict]:
    grp = (
        df.groupby("vendedor", as_index=False)
        .agg(
            total_pedidos=("id_pedido", "count"),
            quantidade_total=("quantidade", "sum"),
            faturamento=("faturamento_usd", "sum"),
        )
        .sort_values("faturamento", ascending=False)
        .reset_index(drop=True)
    )
    grp["faturamento"] = grp["faturamento"].round(2)

    total = len(grp)
    top_n = max(1, round(total * 0.4))
    low_n = max(1, round(total * 0.2))

    def classificacao(rank: int) -> str:
        if rank < top_n:
            return "top"
        if rank >= total - low_n:
            return "low"
        return "mid"

    grp["classificacao"] = [classificacao(i) for i in range(total)]
    grp.insert(0, "posicao", range(1, total + 1))
    return grp.to_dict(orient="records")


def tabela_regioes(df: pd.DataFrame) -> list[dict]:
    grp = (
        df.groupby("regiao", as_index=False)
        .agg(
            faturamento=("faturamento_usd", "sum"),
            total_pedidos=("id_pedido", "count"),
        )
        .sort_values("faturamento", ascending=False)
        .reset_index(drop=True)
    )
    total_fat = grp["faturamento"].sum()
    grp["participacao_pct"] = (grp["faturamento"] / total_fat * 100).round(1)
    grp["faturamento"]      = grp["faturamento"].round(2)
    return grp.to_dict(orient="records")


def tabela_temporal(df: pd.DataFrame) -> list[dict]:
    grp = (
        df.groupby("mes_ano", as_index=False)
        .agg(
            faturamento=("faturamento_usd", "sum"),
            total_pedidos=("id_pedido", "count"),
            quantidade=("quantidade", "sum"),
        )
        .sort_values("mes_ano")
        .reset_index(drop=True)
    )
    grp["periodo"]     = grp["mes_ano"].astype(str)
    grp["faturamento"] = grp["faturamento"].round(2)

    fat = grp["faturamento"]
    evolucao = [None] + [
        round((fat.iloc[i] - fat.iloc[i - 1]) / fat.iloc[i - 1] * 100, 1)
        for i in range(1, len(fat))
    ]
    grp["evolucao_pct"] = evolucao

    return grp.drop(columns=["mes_ano"]).to_dict(orient="records")


def cards_regioes(df: pd.DataFrame) -> list[dict]:
    regioes = tabela_regioes(df)
    emojis  = ["🏙️", "🌐", "🌅", "🌲", "🏖️", "🗺️"]
    for i, r in enumerate(regioes):
        r["emoji"] = emojis[i] if i < len(emojis) else "📍"
    return regioes


def picos_temporais(df: pd.DataFrame) -> dict:
    temporal = tabela_temporal(df)
    maior = max(temporal, key=lambda x: x["faturamento"])
    menor = min(temporal, key=lambda x: x["faturamento"])
    return {"maior": maior, "menor": menor}


def destaques_produtos(df: pd.DataFrame) -> dict:
    produtos = tabela_produtos(df)
    return {
        "melhores": produtos[:3],
        "piores":   produtos[-3:][::-1],
    }


def opcoes_filtros(df: pd.DataFrame) -> dict:
    return {
        "produtos":   sorted(df["produto"].unique().tolist()),
        "vendedores": sorted(df["vendedor"].unique().tolist()),
        "regioes":    sorted(df["regiao"].unique().tolist()),
    }


def _converter_numpy(obj):
    if isinstance(obj, np.integer):
        return int(obj)
    if isinstance(obj, np.floating):
        return float(obj)
    if isinstance(obj, np.ndarray):
        return obj.tolist()
    raise TypeError(f"Tipo não serializável: {type(obj)}")


def exportar_para_js(df: pd.DataFrame, caminho: str = JS_OUT_PATH) -> str:
    dados = {
        "kpis":               kpis_gerais(df),
        "vendas":             tabela_vendas(df),
        "produtos":           tabela_produtos(df),
        "vendedores":         tabela_vendedores(df),
        "regioes":            tabela_regioes(df),
        "temporal":           tabela_temporal(df),
        "cards_regioes":      cards_regioes(df),
        "picos":              picos_temporais(df),
        "destaques_produtos": destaques_produtos(df),
        "filtros":            opcoes_filtros(df),
    }

    os.makedirs(os.path.dirname(caminho), exist_ok=True)
    conteudo_json = json.dumps(dados, default=_converter_numpy, ensure_ascii=False)
    with open(caminho, "w", encoding="utf-8") as f:
        f.write(f"window.DADOS_VENDAS = {conteudo_json};\n")
    return caminho


def _fmt_usd(valor: float) -> str:
    return f"{float(valor):,.2f}".replace(",", "X").replace(".", ",").replace("X", ".")


def _fmt_int(valor: int) -> str:
    return f"{int(valor):,}".replace(",", ".")


def _substituir_tbody(conteudo: str, tbody_id: str, linhas_html: str) -> str:
    padrao = rf'(<tbody id="{tbody_id}">)(.*?)(</tbody>)'
    return re.sub(padrao, rf"\1\n{linhas_html}\n                            \3", conteudo, flags=re.DOTALL)


def atualizar_html(df: pd.DataFrame, caminho_html: str = HTML_PATH) -> str:
    with open(caminho_html, "r", encoding="utf-8") as f:
        conteudo = f.read()

    label_status = {"top": "Destaque", "mid": "Regular", "low": "Baixo"}
    linhas_produtos = "\n".join(
        f'                                <tr><td>{p["ranking"]}</td><td>{html.escape(p["produto"])}</td>'
        f'<td>{_fmt_int(p["quantidade_vendida"])}</td><td>$ {_fmt_usd(p["faturamento"])}</td>'
        f'<td><span class="badge-status {p["status"]}">{label_status[p["status"]]}</span></td></tr>'
        for p in tabela_produtos(df)
    )
    conteudo = _substituir_tbody(conteudo, "tbody-produtos", linhas_produtos)

    label_class = {"top": "⭐ Top", "mid": "Regular", "low": "Atenção"}
    linhas_vendedores = "\n".join(
        f'                                <tr><td><strong>{v["posicao"]}º</strong></td><td>{html.escape(v["vendedor"])}</td>'
        f'<td>{v["total_pedidos"]} pedidos / {_fmt_int(v["quantidade_total"])} itens</td>'
        f'<td>$ {_fmt_usd(v["faturamento"])}</td>'
        f'<td><span class="badge-status {v["classificacao"]}">{label_class[v["classificacao"]]}</span></td></tr>'
        for v in tabela_vendedores(df)
    )
    conteudo = _substituir_tbody(conteudo, "tbody-vendedores", linhas_vendedores)

    linhas_regioes = "\n".join(
        f'                                <tr><td>{html.escape(r["regiao"])}</td><td>$ {_fmt_usd(r["faturamento"])}</td>'
        f'<td>{r["total_pedidos"]}</td><td>{r["participacao_pct"]:.1f} %</td></tr>'
        for r in tabela_regioes(df)
    )
    conteudo = _substituir_tbody(conteudo, "tbody-regioes", linhas_regioes)

    linhas_temporal_list = []
    for t in tabela_temporal(df):
        evo = t["evolucao_pct"]
        if evo is None:
            evo_html = "—"
        elif evo >= 0:
            evo_html = f'<span class="text-success">▲ {abs(evo):.1f} %</span>'
        else:
            evo_html = f'<span class="text-danger">▼ {abs(evo):.1f} %</span>'
        linhas_temporal_list.append(
            f'                                <tr><td>{html.escape(t["periodo"])}</td><td>$ {_fmt_usd(t["faturamento"])}</td>'
            f'<td>{t["total_pedidos"]}</td><td>{_fmt_int(t["quantidade"])}</td><td>{evo_html}</td></tr>'
        )
    conteudo = _substituir_tbody(conteudo, "tbody-temporal", "\n".join(linhas_temporal_list))

    linhas_vendas = "\n".join(
        f'                                <tr><td>{html.escape(v["id_pedido"])}</td><td>{html.escape(v["data_venda"])}</td>'
        f'<td>{html.escape(v["produto"])}</td><td>{v["quantidade"]}</td>'
        f'<td>$ {_fmt_usd(v["preco_unitario_usd"])}</td><td>$ {_fmt_usd(v["total_venda_usd"])}</td>'
        f'<td>$ {_fmt_usd(v["faturamento_usd"])}</td><td>{html.escape(v["regiao"])}</td>'
        f'<td>{html.escape(v["vendedor"])}</td></tr>'
        for v in tabela_vendas(df)[:20]
    )
    conteudo = _substituir_tbody(conteudo, "tbody-vendas", linhas_vendas)

    with open(caminho_html, "w", encoding="utf-8") as f:
        f.write(conteudo)
    return caminho_html
