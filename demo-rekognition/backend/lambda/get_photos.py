import json
import boto3
import os
from decimal import Decimal

dynamodb = boto3.resource('dynamodb')
s3 = boto3.client('s3')

def decimal_default(obj):
    if isinstance(obj, Decimal):
        return float(obj)
    raise TypeError

def lambda_handler(event, context):
    try:
        table_name = os.environ['PHOTOS_TABLE']
        table = dynamodb.Table(table_name)
        
        response = table.scan()
        items = response['Items']
        
        photos = []
        for item in items:
            faces = []
            for face in item.get('faces', []):
                face_data = {
                    'faceId': face.get('faceId', ''),
                    'confidence': face.get('confidence', 0)
                }
                
                if 'boundingBox' in face:
                    bbox = face['boundingBox']
                    face_data['boundingBox'] = {
                        'width': bbox.get('Width', 0),
                        'height': bbox.get('Height', 0),
                        'left': bbox.get('Left', 0),
                        'top': bbox.get('Top', 0)
                    }
                
                faces.append(face_data)
            
            direct_url = item.get('url', '')
            if 's3Key' in item:
                bucket_name = os.environ.get('PHOTOS_BUCKET')
                if bucket_name:
                    region = os.environ.get('AWS_REGION', 'us-east-1')
                    direct_url = f'https://{bucket_name}.s3.{region}.amazonaws.com/{item["s3Key"]}'
                else:
                    print(f"Warning: PHOTOS_BUCKET environment variable not set")
            
            photo = {
                'id': item['photoId'],
                'url': direct_url,
                'uploadDate': item['uploadDate'],
                'faces': faces
            }
            photos.append(photo)
        
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Headers': 'Content-Type',
                'Access-Control-Allow-Methods': 'OPTIONS,GET'
            },
            'body': json.dumps(photos, default=decimal_default)
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