import analysis


def main():
    df = analysis.carregar_dados()
    caminho_html = analysis.atualizar_html(df)
    caminho_js = analysis.exportar_para_js(df)
    print(f"Tabelas geradas em: {caminho_html}")
    print(f"Dados exportados em: {caminho_js}")
    print(f"Total de registros: {len(df)}")


if __name__ == "__main__":
    main()
