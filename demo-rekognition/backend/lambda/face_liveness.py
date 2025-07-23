import json
import boto3
import base64
import os
import time
from datetime import datetime
from botocore.exceptions import ClientError

rekognition = boto3.client('rekognition')

def lambda_handler(event, context):
    try:
        body = json.loads(event['body'])
        
        image_data = body.get('image')
        session_id = body.get('sessionId', f'session-{int(time.time())}')
        
        if not image_data:
            return {
                'statusCode': 400,
                'headers': {
                    'Access-Control-Allow-Origin': '*',
                },
                'body': json.dumps({'error': 'Image data is required'})
            }
        
        try:
            image_bytes = base64.b64decode(image_data)
            
            detect_response = rekognition.detect_faces(
                Image={'Bytes': image_bytes},
                Attributes=['ALL']
            )
            
            faces = detect_response.get('FaceDetails', [])
            
            if not faces:
                return {
                    'statusCode': 200,
                    'headers': {
                        'Access-Control-Allow-Origin': '*',
                        'Access-Control-Allow-Headers': 'Content-Type',
                        'Access-Control-Allow-Methods': 'OPTIONS,POST'
                    },
                    'body': json.dumps({
                        'isLive': False,
                        'confidence': 0,
                        'reason': 'No face detected',
                        'sessionId': session_id,
                        'timestamp': datetime.now().isoformat()
                    })
                }
            
            face = faces[0]
            
            quality = face.get('Quality', {})
            brightness = quality.get('Brightness', 0)
            sharpness = quality.get('Sharpness', 0)
            
            eyes_open = True
            landmarks = face.get('Landmarks', [])
            
            for landmark in landmarks:
                if landmark.get('Type') in ['eyeLeft', 'eyeRight']:
                    pass
            
            pose = face.get('Pose', {})
            yaw = abs(pose.get('Yaw', 0))
            pitch = abs(pose.get('Pitch', 0))
            roll = abs(pose.get('Roll', 0))
            
            confidence_score = face.get('Confidence', 0)

            is_live = (
                confidence_score > 90 and
                brightness > 30 and brightness < 90 and
                sharpness > 30 and
                yaw < 30 and pitch < 30 and roll < 30
            )
            
            result = {
                'isLive': is_live,
                'confidence': confidence_score,
                'faceQuality': {
                    'brightness': brightness,
                    'sharpness': sharpness
                },
                'pose': pose,
                'sessionId': session_id,
                'timestamp': datetime.now().isoformat()
            }
            
        except ClientError as e:
            print(f"Error calling Rekognition: {e}")
            return {
                'statusCode': 500,
                'headers': {
                    'Access-Control-Allow-Origin': '*',
                },
                'body': json.dumps({'error': 'Face detection failed'})
            }
        
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Headers': 'Content-Type',
                'Access-Control-Allow-Methods': 'OPTIONS,POST'
            },
            'body': json.dumps(result, default=str)
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