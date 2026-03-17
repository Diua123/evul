
# Prompt de Desenvolvimento: Plataforma Acadêmica EV-UL

## 1. Visão Geral do Projeto
Crie uma aplicação web progressiva (PWA) chamada **EV-UL**, uma plataforma dedicada aos estudantes de Educação Visual da Universidade Licungo (Quelimane, Moçambique). A aplicação deve centralizar comunicação, repositório acadêmico, galeria artística e rede social interna.

## 2. Identidade Visual e UI/UX
- **Paleta de Cores**: 
  - Azul Institucional (`#0088cc`) - Primária.
  - Castanho Acadêmico (`#6B3F1F`) - Secundária/Destaque.
  - Escuro (`#333333`) - Fundo Dark Mode.
  - Texto Suave (`#cce0f5`) - Contraste.
- **Tipografia**: Família 'Inter', com foco em legibilidade e hierarquia moderna.
- **Estética**: Design baseado em cards com cantos extremamente arredondados (`rounded-[2.5rem]`), sombras suaves e transições fluidas.
- **Navegação**: Menu superior/inferior com botões de ícones e fontes reduzidas (`text-[9px]`), em negrito e maiúsculas (`font-black uppercase tracking-tighter`) para evitar sobreposição em telas pequenas.

## 3. Funcionalidades de Autenticação e Perfil
- **Sistema de Login/Cadastro**:
  - Máscara de entrada para Número de Estudante: `XX.XXXX.XXXX`.
  - **Lógica de Ano Automático**: Ao cadastrar, o sistema deve detectar o ano de frequência baseado nos 4 últimos dígitos do número (Ex: final `2026` = 1º Ano; `2025` = 2º Ano; `2024` = 3º Ano; `2023` = 4º Ano).
  - Foto de perfil obrigatória ou avatar padrão em SVG.
- **Gestão de Perfil**: Edição de nome e foto, visualização de estatísticas acadêmicas (Ano/Número).

## 4. Módulos Principais
### A. Chat em Tempo Real
- **Canais**: Chat Geral e Mensagens Privadas entre usuários.
- **Mídia no Chat**: 
  - Suporte para envio de imagens.
  - Suporte para vídeos (limite estrito de 30 segundos).
  - Suporte para áudio: Gravação direta no app (Microfone) e escolha de arquivos do dispositivo.
  - Funcionalidade de **Download** de mídias recebidas.
- **Interface**: Estilo "bolha" de mensagens com carimbo de hora e fotos de perfil dos autores.

### B. Comunidades e Avisos
- Canais segregados por ano (1º ao 4º) e Canal Geral.
- **Segurança**: Apenas usuários com chave de acesso mestre (`000000`) podem publicar comunicados oficiais.
- Visual: Cards com borda lateral colorida indicando a categoria.

### C. Publicações e Feed (Rede Social)
- Feed de notícias onde estudantes postam momentos acadêmicos.
- **Interação**: Sistema de "Adoros" (Likes) e seção de comentários real em cada post.
- Upload de fotos e vídeos curtos (30s).

### D. Biblioteca Digital (Repositório)
- Categorias: Trabalhos Científicos, Monografias, Planos Analíticos, Horários, Livros e Materiais.
- Integração de arquivos estáticos (GitHub Raw) e arquivos carregados por usuários.
- Interface de busca e filtragem por nome ou autor.

## 5. Requisitos Técnicos e Configurações
- **Tecnologias**: React 19, Tailwind CSS, React Router 7, Lucide Icons/FontAwesome.
- **Persistência**: Uso extensivo de `localStorage` para simular um backend (Serviço de Storage dedicado).
- **Internacionalização**: Sistema de i18n suportando Português (PT), Inglês (EN) e Francês (FR).
- **Temas**: Suporte completo a Modo Claro e Modo Escuro com persistência de preferência.
- **Permissões**: Necessário solicitar acesso à Câmera e Microfone no navegador.

## 6. Lógica de Negócio Específica
1. **Vídeos**: Qualquer vídeo enviado (Feed ou Chat) deve ser validado via metadados para não exceder 30 segundos.
2. **Download**: Implementar função de download forçado via `blob` ou link `anchor` para garantir que o usuário possa baixar materiais acadêmicos e mídias do chat.
3. **Responsividade**: Mobile-first absoluto, garantindo que o menu de navegação não quebre em dispositivos com largura a partir de 320px.
