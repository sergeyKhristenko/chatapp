cmdid=$(aws ssm send-command \
    --document-name "AWS-RunShellScript" \
    --targets "Key=InstanceIds,Values=i-061f5586b6765f895" \
    --cli-input-json file://./deploy.json \
    --query "Command.CommandId" \
    --output text)

# aws ssm list-command-invocations --command-id "b82dc2cb-03e0-498f-bb96-1c857cee083b" --details --query "CommandInvocations[*].CommandPlugins[*].Output[]" --output text
