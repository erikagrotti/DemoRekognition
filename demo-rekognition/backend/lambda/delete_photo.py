import json
import boto3
import os
from botocore.exceptions import ClientError

s3 = boto3.client('s3')
dynamodb = boto3.resource('dynamodb')

def lambda_handler(event, context):
    try:
        photo_id = event['pathParameters']['photoId']
        bucket_name = os.environ['PHOTOS_BUCKET']
        table_name = os.environ['PHOTOS_TABLE']
        
        table = dynamodb.Table(table_name)
        
        try:
            photo_response = table.get_item(
                Key={'photoId': photo_id}
            )
            
            if 'Item' not in photo_response:
                return {
                    'statusCode': 404,
                    'headers': {
                        'Access-Control-Allow-Origin': '*',
                    },
                    'body': json.dumps({'error': 'Photo not found'})
                }
            
            photo_item = photo_response['Item']
            
        except Exception as e:
            print(f"Error getting photo metadata: {e}")
            return {
                'statusCode': 500,
                'headers': {
                    'Access-Control-Allow-Origin': '*',
                },
                'body': json.dumps({'error': 'Error retrieving photo metadata'})
            }
        
        try:
            s3.delete_object(
                Bucket=bucket_name,
                Key=photo_item['s3Key']
            )
        except ClientError as e:
            print(f"Error deleting from S3: {e}")
        
        try:
            table.delete_item(
                Key={'photoId': photo_id}
            )
        except Exception as e:
            print(f"Error deleting from DynamoDB: {e}")
            return {
                'statusCode': 500,
                'headers': {
                    'Access-Control-Allow-Origin': '*',
                },
                'body': json.dumps({'error': 'Error deleting photo metadata'})
            }
        
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Headers': 'Content-Type',
                'Access-Control-Allow-Methods': 'OPTIONS,DELETE'
            },
            'body': json.dumps({'message': 'Photo deleted successfully'})
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