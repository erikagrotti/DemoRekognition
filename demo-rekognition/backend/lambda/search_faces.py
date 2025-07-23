import json
import boto3
import base64
import os
from decimal import Decimal
from botocore.exceptions import ClientError

s3 = boto3.client('s3')
dynamodb = boto3.resource('dynamodb')
rekognition = boto3.client('rekognition')

def decimal_default(obj):
    if isinstance(obj, Decimal):
        return float(obj)
    raise TypeError

def lambda_handler(event, context):
    try:
        body = json.loads(event['body'])
        search_data = body.get('image')
        
        if not search_data:
            return {
                'statusCode': 400,
                'headers': {
                    'Access-Control-Allow-Origin': '*',
                },
                'body': json.dumps({'error': 'Image data is required'})
            }
        
        bucket_name = os.environ['PHOTOS_BUCKET']
        table_name = os.environ['PHOTOS_TABLE']
        collection_id = os.environ['REKOGNITION_COLLECTION']
        
        image_bytes = base64.b64decode(search_data)
        
        try:
            search_response = rekognition.search_faces_by_image(
                CollectionId=collection_id,
                Image={'Bytes': image_bytes},
                MaxFaces=10,
                FaceMatchThreshold=70
            )
        except ClientError as e:
            if e.response['Error']['Code'] == 'ResourceNotFoundException':
                return {
                    'statusCode': 200,
                    'headers': {
                        'Access-Control-Allow-Origin': '*',
                        'Access-Control-Allow-Headers': 'Content-Type',
                        'Access-Control-Allow-Methods': 'OPTIONS,POST'
                    },
                    'body': json.dumps({
                        'photos': [],
                        'totalCount': 0
                    })
                }
            raise e
        
        table = dynamodb.Table(table_name)
        matched_photos = []
        
        for match in search_response['FaceMatches']:
            external_image_id = match['Face']['ExternalImageId']
            
            try:
                photo_response = table.get_item(
                    Key={'photoId': external_image_id}
                )
                
                if 'Item' in photo_response:
                    item = photo_response['Item']
                    
                    direct_url = item['url']
                    if 's3Key' in item:
                        region = os.environ.get('AWS_REGION', 'us-east-1')
                        direct_url = f'https://{bucket_name}.s3.{region}.amazonaws.com/{item["s3Key"]}'
                    
                    photo = {
                        'id': item['photoId'],
                        'url': direct_url,
                        'uploadDate': item['uploadDate'],
                        'faces': [
                            {
                                **face,
                                'confidence': match['Similarity'] / 100 
                            }
                            for face in item.get('faces', [])
                        ]
                    }
                    matched_photos.append(photo)
            except Exception as e:
                print(f"Error getting photo {external_image_id}: {e}")
                continue
        
        result = {
            'photos': matched_photos,
            'totalCount': len(matched_photos)
        }
        
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Headers': 'Content-Type',
                'Access-Control-Allow-Methods': 'OPTIONS,POST'
            },
            'body': json.dumps(result, default=decimal_default)
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