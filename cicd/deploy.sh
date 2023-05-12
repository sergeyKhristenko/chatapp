cmdid=$(aws ssm send-command \
    --document-name "AWS-RunShellScript" \
    --targets "Key=InstanceIds,Values=i-061f5586b6765f895" \
    --cli-input-json file://./cicd/deploy.json \
    --query "Command.CommandId" \
    --output text)

echo "$cmdid"

aws ssm list-command-invocations --command-id "634cdd78-82ce-4c25-9a93-d4cbac6904f8" --details --query "CommandInvocations[*].CommandPlugins[*].Output[]" --output text
