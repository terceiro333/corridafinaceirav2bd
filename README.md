# Corrida Financeira V2

Esta � uma vers�o visualmente modernizada e independente da Corrida Financeira. Ela preserva todas as mec�nicas da V1, mas utiliza chaves de armazenamento com o prefixo `corridaFinanceiraV2`, portanto seu progresso n�o � compartilhado com a vers�o original.

## Moderniza��o do cen�rio

- Rua com acabamento de asfalto, bordas pintadas, meio-fio e divis�es de cal�ada.
- Pr�dios com fachadas variadas, vitrines, entradas, janelas em profundidade, varandas, elementos de cobertura e equipamentos t�cnicos.
- �rvores detalhadas, lumin�rias urbanas, bancos, lixeiras, placas e ve�culos decorativos posicionados fora da pista.
- Ilumina��o PBR com mapeamento de tom cinematogr�fico, mantendo os modos de dia e noite.
- Geometrias e materiais reutilizados para evitar cria��es desnecess�rias durante a corrida.

## Assets 3D externos inclu�dos na V2

O trecho demonstrativo usa seis modelos GLB do **City Kit (Commercial)**, de **Kenney**, distribu�do sob **CC0 1.0 Universal**. Os modelos est�o em `assets/models/kenney-city-kit/`; o pacote original tamb�m inclui as varia��es mantidas para expans�o posterior. Fonte: `https://poly.pizza/bundle/City-Kit-0CkvGrBJ0u` (bundle oficial de Kenney no Poly Pizza). A licen�a CC0 permite uso, modifica��o e distribui��o, inclusive comercialmente, sem atribui��o obrigat�ria.

O `GLTFLoader` e o runtime de m�dulo correspondente ao Three.js 0.160.0 foram inclu�dos localmente em `assets/vendor/`, portanto nenhum modelo ou carregador � buscado em um site externo durante a partida.

Endless runner 3D para navegador com três pistas, coleta de R$, obstáculos variados, aumento progressivo de velocidade e recorde salvo no navegador.

O menu também possui uma central de investimentos. Empresas oferecem retorno potencial de 2x com risco total nesta simulação educativa; a Poupança retorna sempre o valor aplicado com lucro de 15%, e o Tesouro Selic retorna sempre o valor aplicado com lucro de 25%. Saldo e operações são persistidos no navegador.

## Loja de skins

A loja usa o mesmo saldo acumulado das corridas. Real Madrid, AC Milan, PSG e Liverpool custam R$ 2.000 cada; Brasil, França, Bélgica, Inglaterra, Alemanha e Argentina custam R$ 5.000 cada. A camisa original permanece gratuita. Compras e skin equipada ficam salvas no `localStorage`, e a camisa escolhida altera os materiais do personagem 3D durante a corrida.

## Simulação educativa de apostas

A área **Tigrinho** demonstra como promessas de retorno de até 5x podem induzir a decisões arriscadas. Nesta simulação, toda aposta resulta em perda integral. Saldo, total apostado e total perdido ficam salvos localmente; nenhum dinheiro real é utilizado.

## Configurações

O menu de configurações possui controles independentes para o volume da música e dos efeitos sonoros, opção para reduzir os efeitos visuais de coleta, contador opcional de FPS e controle do rastro vermelho do mouse. Todas as preferências são salvas no `localStorage` e podem ser restauradas aos valores padrão.

Em **Dados e Progresso**, a redefinição completa exige duas confirmações e a digitação de `REDEFINIR`. A função central `resetAllProgress()` remove saldo, recordes, skins, casa, apostas e investimentos, mantendo apenas as preferências pessoais de áudio, vídeo e modo dia/noite.

## Casa evolutiva

A opção **Casa** usa o mesmo saldo das corridas. O jogador começa com a Casa Velha e pode avançar por cinco níveis até a Casa Luxuosa. Cada etapa reconstrói uma cena Three.js 3D com arquitetura, móveis, jardim e iluminação próprios; a câmera pode ser girada por arraste. O nível e o total investido permanecem salvos no navegador.

Os preços podem ser ajustados no vetor `HOUSE_UPGRADE_COSTS`, em `js/game.js`.

## Personagens

A Loja de Skins também oferece seleção entre os modelos 3D masculino e feminino, com pré-visualização animada. Os dois compartilham o mesmo controlador, hitbox e sistema de skins; a escolha é salva em `corridaFinanceiraSelectedCharacter`.

A coleção inclui camisas inspiradas em clubes brasileiros e seleções, usando padrões gráficos originais e simplificados para preservar a identidade de cores e listras sem reproduzir escudos, marcas ou patrocinadores.

## Música

**Shade (Drift Phonk style music)**, de Evgeny Bardyuzha, disponibilizada sob a Pixabay Content License. O áudio toca em loop após a primeira interação e pode ser silenciado pelo botão no canto superior direito; a preferência fica salva no navegador.

## Publicar no GitHub Pages

1. Envie todo o conteúdo desta pasta para a raiz de um repositório.
2. No GitHub, abra **Settings → Pages**.
3. Em **Build and deployment**, selecione **Deploy from a branch**, a branch `main` e a pasta `/ (root)`.
4. Abra o endereço informado pelo GitHub.

O projeto não usa backend nem processo de build. O Three.js e a fonte são carregados de CDNs públicas; os demais caminhos são relativos e funcionam em subdiretórios.

## Controles

- `A` / `←`: esquerda
- `D` / `→`: direita
- `W` / `↑` / `Espaço`: pular
- `S` / `↓`: deslizar
- `F8`: abrir ou fechar o console de desenvolvedor
- Em telas de toque: deslize para a direção desejada.

## Console de desenvolvedor

O console interno é controlado por `DEV_CONSOLE_ENABLED` em `js/game.js`. Os comandos reservados `givedinheiro <quantidade>` e `removedinheiro <quantidade>` alteram até R$ 1.000.000 por execução. Novos comandos podem ser registrados por `registerCommand(nome, descrição, callback)` sem serem divulgados na interface.
