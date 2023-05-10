aws ssm send-command \
    --document-name "AWS-RunShellScript" \
    --targets "Key=InstanceIds,Values=i-061f5586b6765f895" \
    --cli-input-json file://./deploy.json
