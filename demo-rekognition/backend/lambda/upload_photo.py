import json
import boto3
import base64
import uuid
import os
from datetime import datetime
from decimal import Decimal
from botocore.exceptions import ClientError

s3 = boto3.client('s3')
dynamodb = boto3.resource('dynamodb')
rekognition = boto3.client('rekognition')

def lambda_handler(event, context):
    try:
        body = json.loads(event['body'])
        photo_data = body.get('image')
        
        if not photo_data:
            return {
                'statusCode': 400,
                'headers': {
                    'Access-Control-Allow-Origin': '*',
                    'Access-Control-Allow-Headers': 'Content-Type',
                    'Access-Control-Allow-Methods': 'OPTIONS,POST'
                },
                'body': json.dumps({'error': 'Image data is required'})
            }
        
        photo_id = str(uuid.uuid4())
        bucket_name = os.environ['PHOTOS_BUCKET']
        table_name = os.environ['PHOTOS_TABLE']
        collection_id = os.environ['REKOGNITION_COLLECTION']
        
        image_bytes = base64.b64decode(photo_data)
        
        s3_key = f'photos/{photo_id}.jpg'
        s3.put_object(
            Bucket=bucket_name,
            Key=s3_key,
            Body=image_bytes,
            ContentType='image/jpeg'
        )
        
        try:
            rekognition.create_collection(CollectionId=collection_id)
        except ClientError as e:
            if e.response['Error']['Code'] != 'ResourceAlreadyExistsException':
                raise e
        
        detect_faces_response = rekognition.detect_faces(
            Image={'Bytes': image_bytes},
            Attributes=['ALL']
        )
        
        indexed_faces = []
        if detect_faces_response['FaceDetails']:
            try:
                index_response = rekognition.index_faces(
                    CollectionId=collection_id,
                    Image={'Bytes': image_bytes},
                    ExternalImageId=photo_id,
                    DetectionAttributes=['ALL']
                )
                indexed_faces = index_response['FaceRecords']
            except ClientError as e:
                print(f"Error indexing faces: {e}")
        
        table = dynamodb.Table(table_name)
        photo_metadata = {
            'photoId': photo_id,
            'uploadDate': datetime.now().isoformat(),
            's3Key': s3_key,
            'faces': [
                {
                    'faceId': face['Face']['FaceId'],
                    'boundingBox': {
                        'Width': Decimal(str(face['Face']['BoundingBox']['Width'])),
                        'Height': Decimal(str(face['Face']['BoundingBox']['Height'])),
                        'Left': Decimal(str(face['Face']['BoundingBox']['Left'])),
                        'Top': Decimal(str(face['Face']['BoundingBox']['Top']))
                    },
                    'confidence': Decimal(str(face['Face']['Confidence']))
                }
                for face in indexed_faces
            ],
            'url': f'https://{bucket_name}.s3.{os.environ.get("AWS_REGION", "us-east-1")}.amazonaws.com/{s3_key}'
        }
        
        table.put_item(Item=photo_metadata)
        
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Headers': 'Content-Type',
                'Access-Control-Allow-Methods': 'OPTIONS,POST'
            },
            'body': json.dumps(photo_metadata, default=str)
        }
        
    except Exception as e:
        print(f"Error: {str(e)}")
        return {
            'statusCode': 500,
            'headers': {
                'Access-Control-Allow-Origin': '*',
            },
            'body': json.dumps({'error': str(e)})
        }