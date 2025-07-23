# 📸 Demo Rekognition - Aplicação de Reconhecimento Facial

Uma aplicação Angular moderna e inovadora que utiliza Amazon Rekognition para análise inteligente de imagens e reconhecimento facial.

## 🚀 Funcionalidades

### ✨ Principais Recursos
- **Galeria de Fotos Inteligente**: Upload e visualização de fotos com detecção automática de faces
- **Busca Facial Avançada**: Encontre todas as fotos onde uma pessoa específica aparece
- **Interface Moderna**: Design responsivo com Material Design
- **Autenticação Segura**: Integração completa com AWS Cognito
- **Estatísticas em Tempo Real**: Dashboard com métricas de uso

### 🎯 Funcionalidades Inovadoras
- **Drag & Drop**: Interface intuitiva para upload de fotos
- **Busca por Similaridade**: Upload de foto de referência para encontrar pessoas similares
- **Visualização de Confiança**: Exibe o nível de confiança do reconhecimento
- **Navegação por Abas**: Interface organizada e fácil de usar

## 🛠️ Tecnologias Utilizadas

- **Angular 19**: Framework principal
- **Angular Material**: Componentes de UI
- **TypeScript**: Linguagem de programação
- **RxJS**: Programação reativa
- **AWS Cognito**: Autenticação
- **Amazon Rekognition**: Reconhecimento facial
- **SCSS**: Estilização avançada

## 📋 Pré-requisitos

- Node.js 18+
- Angular CLI 19+
- Conta AWS configurada
- AWS Cognito User Pool configurado

## 🚀 Como Executar

### 1. Instalação
```bash
cd frontend
npm install
```

### 2. Configuração
Edite o arquivo `src/environments/environment.ts`:

```typescript
export const environment = {
  production: false,
  apiUrl: 'http://localhost:3000/api',
  authConfig: {
    cognitoDomain: 'https://seu-dominio.auth.us-east-1.amazoncognito.com',
    appClientId: 'seu-client-id',
    redirectUri: 'http://localhost:4200/auth/callback'
  },
  aws: {
    userPoolId: 'us-east-1_SeuUserPool',
    clientId: 'seu-client-id',
    region: 'us-east-1'
  }
};
```

### 3. Execução
```bash
npm start
```

A aplicação estará disponível em `http://localhost:4200`

## 📱 Como Usar

### 1. Login
- Acesse a aplicação
- Faça login com suas credenciais do Cognito

### 2. Upload de Fotos
- Na aba "Galeria de Fotos"
- Clique em "Adicionar Fotos" ou arraste arquivos
- As faces serão detectadas automaticamente

### 3. Busca Facial
- Na aba "Buscar Pessoa"
- Faça upload de uma foto de referência
- Clique em "Buscar Fotos"
- Veja os resultados com nível de confiança

### 4. Estatísticas
- Na aba "Estatísticas"
- Visualize métricas de uso da aplicação

## 🏗️ Arquitetura

```
src/
├── app/
│   ├── auth/                 # Módulo de autenticação
│   ├── components/           # Componentes da aplicação
│   │   ├── dashboard/        # Dashboard principal
│   │   ├── photo-gallery/    # Galeria de fotos
│   │   ├── face-search/      # Busca facial
│   │   └── loading/          # Componente de loading
│   ├── services/             # Serviços
│   │   └── rekognition.service.ts
│   └── environments/         # Configurações
```

## 🎨 Componentes Principais

### DashboardComponent
- Interface principal com navegação por abas
- Barra de ferramentas com informações do usuário
- Tela de boas-vindas interativa

### PhotoGalleryComponent
- Grid responsivo de fotos
- Upload múltiplo com preview
- Busca por faces similares
- Informações de faces detectadas

### FaceSearchComponent
- Interface drag-and-drop
- Upload de foto de referência
- Resultados com nível de confiança
- Visualização otimizada

## 🔧 Configurações Avançadas

### Personalização de Temas
Edite `src/styles.scss` para personalizar cores e estilos.

### Configuração do Backend
A aplicação espera uma API REST em `http://localhost:3000/api` com os endpoints:
- `POST /photos/upload` - Upload de fotos
- `GET /photos` - Listar fotos
- `GET /photos/search/face/:faceId` - Buscar por face
- `POST /photos/search/person` - Buscar por pessoa

## 📊 Métricas e Monitoramento

A aplicação coleta métricas de:
- Total de fotos processadas
- Faces detectadas
- Buscas realizadas
- Precisão média do reconhecimento

## 🔒 Segurança

- Autenticação via AWS Cognito
- Interceptor HTTP para tokens
- Validação de sessão automática
- Logout seguro

## 🚀 Deploy

Para produção, configure:
1. Ambiente de produção em `environment.prod.ts`
2. Build otimizado: `ng build --prod`
3. Deploy no S3 + CloudFront ou servidor web

Desenvolvido com ❤️ usando Angular e AWS Rekognition