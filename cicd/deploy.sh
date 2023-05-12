cmdid=$(aws ssm send-command \
    --document-name "AWS-RunShellScript" \
    --targets "Key=InstanceIds,Values=i-061f5586b6765f895" \
    --parameters 'commands=["/bin/sh /home/ubuntu/chatapp/deploy.sh"]' \
    --query "Command.CommandId" \
    --output text)

echo "$cmdid"

# aws ssm list-command-invocations --command-id "5f4aac96-7abd-43cb-8e45-2b0f6dc2f6af" --details --query "CommandInvocations[*].CommandPlugins[*].Output[]" --output text
