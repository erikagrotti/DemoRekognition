# 🏗️ Backend - Infraestrutura AWS CDK

## 📋 Recursos Criados

### 🔐 **Autenticação**
- **Cognito User Pool**: Gerenciamento de usuários
- **Cognito User Pool Client**: Cliente da aplicação

### 🗄️ **Armazenamento**
- **S3 Bucket**: Armazenamento de fotos
- **DynamoDB Table**: Metadados das fotos e faces

### 🤖 **Processamento**
- **Amazon Rekognition**: Análise facial e busca
- **Lambda Functions**: APIs serverless em Python

### 🌐 **API**
- **API Gateway**: REST API com autenticação Cognito
- **CORS**: Configurado para frontend

### 🏷️ **Tags e Nomenclatura**
- Todos os recursos seguem padrão: `{CLIENT}-{STAGE}-{RESOURCE}`
- Tags padronizadas para controle de custos e organização

## 🚀 Como Fazer Deploy

### 1. Pré-requisitos
```bash
# AWS CLI configurado
aws configure

# Node.js 18+ instalado
node --version
```

### 2. Configurar Variáveis de Ambiente
```bash
# Copiar arquivo de exemplo
cp .env.example .env

# Editar com suas configurações
nano .env

# Carregar variáveis
source .env
```

### 3. Deploy
```bash
# Deploy automático
./deploy.sh

# Ou manual
npm run build
npx cdk bootstrap aws://$TARGET_ACCOUNT/$TARGET_REGION
npx cdk deploy $CLIENT-stack-$STAGE
```

## 📡 Endpoints da API

### **GET /photos**
- Lista todas as fotos
- Requer autenticação Cognito

### **POST /photos**
- Upload de nova foto
- Body: `{ "image": "base64_string" }`
- Requer autenticação Cognito

### **DELETE /photos/{photoId}**
- Deleta foto específica
- Requer autenticação Cognito

### **POST /photos/search**
- Busca facial por imagem
- Body: `{ "image": "base64_string" }`
- Requer autenticação Cognito

## 🔧 Configuração do Frontend

Após o deploy, copie os outputs e atualize `frontend/src/environments/environment.ts`:

```typescript
export const environment = {
  production: false,
  apiUrl: 'https://YOUR_API_ID.execute-api.REGION.amazonaws.com/prod',
  authConfig: {
    cognitoDomain: 'https://YOUR_DOMAIN.auth.REGION.amazoncognito.com',
    appClientId: 'YOUR_CLIENT_ID',
    redirectUri: 'http://localhost:4200/auth/callback'
  },
  aws: {
    userPoolId: 'REGION_YOUR_POOL_ID',
    clientId: 'YOUR_CLIENT_ID',
    region: 'REGION'
  }
};
```

## 🏷️ Padrão de Nomenclatura

### Recursos AWS
- S3 Bucket: `{CLIENT}-{STAGE}-rekognition-photos`
- DynamoDB: `{CLIENT}-{STAGE}-rekognition-photos`
- Lambda: `{CLIENT}-{STAGE}-rekognition-{FUNCTION}`
- User Pool: `{CLIENT}-{STAGE}-rekognition-users`
- API Gateway: `{CLIENT}-{STAGE}-rekognition-api`

### Tags Aplicadas
- **Environment**: {STAGE}
- **CostCenter**: Erika Grotti
- **Application**: demo-rekognition
- **Owner**: Erika Grotti
- **Backup**: No
- **Project**: demo-rekognition
- **Name**: {CLIENT}-{STAGE}-{RESOURCE}

## 🐍 Funções Lambda Python

### Dependências
- **boto3**: SDK AWS
- **json**: Manipulação JSON
- **base64**: Codificação de imagens
- **uuid**: Geração de IDs únicos

### Estrutura
```
lambda/
├── upload_photo.py     # Upload e indexação de fotos
├── get_photos.py       # Listagem de fotos
├── search_faces.py     # Busca facial
└── delete_photo.py     # Exclusão de fotos
```

## 🔒 Segurança

- ✅ Autenticação via Cognito
- ✅ CORS configurado
- ✅ IAM roles com permissões mínimas
- ✅ S3 bucket privado
- ✅ API Gateway com autorização

## 🧹 Limpeza

Para remover todos os recursos:
```bash
npx cdk destroy $CLIENT-stack-$STAGE
```

⚠️ **Atenção**: Isso deletará todos os dados permanentemente!