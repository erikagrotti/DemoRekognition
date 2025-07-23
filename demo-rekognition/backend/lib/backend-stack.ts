import * as cdk from 'aws-cdk-lib';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as cognito from 'aws-cdk-lib/aws-cognito';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as iam from 'aws-cdk-lib/aws-iam';
import { Tags } from 'aws-cdk-lib';
import { Construct } from 'constructs';

export interface BackendStackProps extends cdk.StackProps {
  stage: string;
  client: string;
  existingUserPoolId: string;
  existingUserPoolClientId: string;
}

export class BackendStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: BackendStackProps) {
    super(scope, id, props);

    Tags.of(this).add('Environment', props.stage);
    Tags.of(this).add('CostCenter', 'Erika Grotti');
    Tags.of(this).add('Application', 'demo-rekognition');
    Tags.of(this).add('Owner', 'Erika Grotti');
    Tags.of(this).add('Backup', 'No');
    Tags.of(this).add('Project', 'demo-rekognition');

    const photosBucket = new s3.Bucket(this, 'PhotosBucket', {
      bucketName: `${props.client}-${props.stage}-rekognition-photos`,
      cors: [{
        allowedMethods: [s3.HttpMethods.GET, s3.HttpMethods.POST, s3.HttpMethods.PUT],
        allowedOrigins: ['*'],
        allowedHeaders: ['*'],
      }],
      publicReadAccess: false,
      blockPublicAccess: new s3.BlockPublicAccess({
        blockPublicAcls: true,
        blockPublicPolicy: false,
        ignorePublicAcls: true,
        restrictPublicBuckets: false,
      }),
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });
    
    photosBucket.addToResourcePolicy(new iam.PolicyStatement({
      effect: iam.Effect.ALLOW,
      principals: [new iam.AnyPrincipal()],
      actions: ['s3:GetObject'],
      resources: [photosBucket.bucketArn + '/photos/*'],
    }));
    Tags.of(photosBucket).add('Name', `${props.client}-${props.stage}-rekognition-photos-bucket`);

    const photosTable = new dynamodb.Table(this, 'PhotosTable', {
      tableName: `${props.client}-${props.stage}-rekognition-photos`,
      partitionKey: { name: 'photoId', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });
    Tags.of(photosTable).add('Name', `${props.client}-${props.stage}-rekognition-photos-table`);

    const lambdaExecutionRole = new iam.Role(this, 'LambdaExecutionRole', {
      roleName: `${props.client}-${props.stage}-rekognition-lambda-execution-role`,
      assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName('service-role/AWSLambdaBasicExecutionRole'),
      ],
      inlinePolicies: {
        RekognitionPolicy: new iam.PolicyDocument({
          statements: [
            new iam.PolicyStatement({
              effect: iam.Effect.ALLOW,
              actions: [
                'rekognition:DetectFaces',
                'rekognition:SearchFacesByImage',
                'rekognition:IndexFaces',
                'rekognition:CreateCollection',
                'rekognition:ListCollections',
              ],
              resources: ['*'],
            }),
            new iam.PolicyStatement({
              effect: iam.Effect.ALLOW,
              actions: [
                's3:GetObject',
                's3:PutObject',
                's3:DeleteObject',
              ],
              resources: [photosBucket.bucketArn + '/*'],
            }),
            new iam.PolicyStatement({
              effect: iam.Effect.ALLOW,
              actions: [
                'dynamodb:GetItem',
                'dynamodb:PutItem',
                'dynamodb:UpdateItem',
                'dynamodb:DeleteItem',
                'dynamodb:Scan',
                'dynamodb:Query',
              ],
              resources: [photosTable.tableArn],
            }),
          ],
        }),
      },
    });
    Tags.of(lambdaExecutionRole).add('Name', `${props.client}-${props.stage}-rekognition-lambda-execution-role`);

    const uploadPhotoFunction = new lambda.Function(this, 'UploadPhotoFunction', {
      functionName: `${props.client}-${props.stage}-rekognition-upload-photo`,
      runtime: lambda.Runtime.PYTHON_3_11,
      handler: 'upload_photo.lambda_handler',
      code: lambda.Code.fromAsset('lambda'),
      role: lambdaExecutionRole,
      environment: {
        PHOTOS_BUCKET: photosBucket.bucketName,
        PHOTOS_TABLE: photosTable.tableName,
        REKOGNITION_COLLECTION: `${props.client}-${props.stage}-rekognition-faces`,
      },
      timeout: cdk.Duration.seconds(30),
    });
    Tags.of(uploadPhotoFunction).add('Name', `${props.client}-${props.stage}-rekognition-upload-photo-function`);

    const getPhotosFunction = new lambda.Function(this, 'GetPhotosFunction', {
      functionName: `${props.client}-${props.stage}-rekognition-get-photos`,
      runtime: lambda.Runtime.PYTHON_3_11,
      handler: 'get_photos.lambda_handler',
      code: lambda.Code.fromAsset('lambda'),
      role: lambdaExecutionRole,
      environment: {
        PHOTOS_TABLE: photosTable.tableName,
        PHOTOS_BUCKET: photosBucket.bucketName,
      },
    });
    Tags.of(getPhotosFunction).add('Name', `${props.client}-${props.stage}-rekognition-get-photos-function`);

    const searchFacesFunction = new lambda.Function(this, 'SearchFacesFunction', {
      functionName: `${props.client}-${props.stage}-rekognition-search-faces`,
      runtime: lambda.Runtime.PYTHON_3_11,
      handler: 'search_faces.lambda_handler',
      code: lambda.Code.fromAsset('lambda'),
      role: lambdaExecutionRole,
      environment: {
        PHOTOS_BUCKET: photosBucket.bucketName,
        PHOTOS_TABLE: photosTable.tableName,
        REKOGNITION_COLLECTION: `${props.client}-${props.stage}-rekognition-faces`,
      },
      timeout: cdk.Duration.seconds(30),
    });
    Tags.of(searchFacesFunction).add('Name', `${props.client}-${props.stage}-rekognition-search-faces-function`);

    const deletePhotoFunction = new lambda.Function(this, 'DeletePhotoFunction', {
      functionName: `${props.client}-${props.stage}-rekognition-delete-photo`,
      runtime: lambda.Runtime.PYTHON_3_11,
      handler: 'delete_photo.lambda_handler',
      code: lambda.Code.fromAsset('lambda'),
      role: lambdaExecutionRole,
      environment: {
        PHOTOS_BUCKET: photosBucket.bucketName,
        PHOTOS_TABLE: photosTable.tableName,
      },
    });
    Tags.of(deletePhotoFunction).add('Name', `${props.client}-${props.stage}-rekognition-delete-photo-function`);

    const faceLivenessFunction = new lambda.Function(this, 'FaceLivenessFunction', {
      functionName: `${props.client}-${props.stage}-rekognition-face-liveness`,
      runtime: lambda.Runtime.PYTHON_3_11,
      handler: 'face_liveness.lambda_handler',
      code: lambda.Code.fromAsset('lambda'),
      role: lambdaExecutionRole,
      timeout: cdk.Duration.seconds(30),
    });
    Tags.of(faceLivenessFunction).add('Name', `${props.client}-${props.stage}-rekognition-face-liveness-function`);

    const existingUserPool = cognito.UserPool.fromUserPoolId(
      this, 
      'ExistingUserPool', 
      props.existingUserPoolId
    );

    const api = new apigateway.RestApi(this, 'RekognitionApi', {
      restApiName: `${props.client}-${props.stage}-rekognition-api`,
      description: 'API for photo recognition service',
      defaultCorsPreflightOptions: {
        allowOrigins: apigateway.Cors.ALL_ORIGINS,
        allowMethods: apigateway.Cors.ALL_METHODS,
        allowHeaders: ['Content-Type', 'X-Amz-Date', 'Authorization', 'X-Api-Key'],
      },
    });
    Tags.of(api).add('Name', `${props.client}-${props.stage}-rekognition-api-gateway`);

    const authorizer = new apigateway.CognitoUserPoolsAuthorizer(this, 'ApiAuthorizer', {
      authorizerName: `${props.client}-${props.stage}-rekognition-authorizer`,
      cognitoUserPools: [existingUserPool],
    });

    const photosResource = api.root.addResource('photos');
    
    photosResource.addMethod('GET', new apigateway.LambdaIntegration(getPhotosFunction), {
      authorizer,
    });
    
    photosResource.addMethod('POST', new apigateway.LambdaIntegration(uploadPhotoFunction), {
      authorizer,
    });

    const photoResource = photosResource.addResource('{photoId}');
    photoResource.addMethod('DELETE', new apigateway.LambdaIntegration(deletePhotoFunction), {
      authorizer,
    });

    const searchResource = photosResource.addResource('search');
    searchResource.addMethod('POST', new apigateway.LambdaIntegration(searchFacesFunction), {
      authorizer,
    });

    const livenessResource = api.root.addResource('liveness');
    livenessResource.addMethod('POST', new apigateway.LambdaIntegration(faceLivenessFunction), {
      authorizer,
    });

    new cdk.CfnOutput(this, 'ApiUrl', {
      value: api.url,
      description: 'API Gateway URL',
    });

    new cdk.CfnOutput(this, 'PhotosBucketName', {
      value: photosBucket.bucketName,
      description: 'S3 Photos Bucket Name',
    });
  }
}