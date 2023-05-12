cmdid=$(aws ssm send-command \
    --document-name "AWS-RunShellScript" \
    --targets "Key=InstanceIds,Values="$INSTANCE_ID"" \
    --cli-input-json file://./cicd/deploy.json \
    --query "Command.CommandId" \
    --output text)

echo "$cmdid"

# to check command by id. Replace "cmdid" with your id
# aws ssm list-command-invocations --command-id "$cmdid" --details --query "CommandInvocations[*].CommandPlugins[*].Output[]" --output text
