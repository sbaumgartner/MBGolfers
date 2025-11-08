#!/bin/bash

# Golf Playgroups - Terraform Setup Script
# This script creates placeholder Lambda ZIP files for initial Terraform deployment

set -e

echo "=================================================="
echo "Golf Playgroups - Terraform Setup"
echo "=================================================="
echo ""

# Check if we're in the terraform directory
if [ ! -f "main.tf" ]; then
    echo "Error: main.tf not found. Please run this script from the terraform directory."
    exit 1
fi

echo "Step 1: Creating placeholder Lambda functions..."
echo ""

# Function to create a placeholder Lambda
create_placeholder_lambda() {
    local function_name=$1
    local temp_dir="temp_${function_name}"

    echo "  Creating ${function_name}.zip..."

    # Create temporary directory
    mkdir -p "$temp_dir"

    # Create placeholder index.js
    cat > "$temp_dir/index.js" << 'EOF'
exports.handler = async (event) => {
    console.log('Event:', JSON.stringify(event, null, 2));

    return {
        statusCode: 501,
        headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
        },
        body: JSON.stringify({
            message: 'This Lambda function is not yet implemented',
            function: process.env.AWS_LAMBDA_FUNCTION_NAME
        })
    };
};
EOF

    # Create placeholder package.json
    cat > "$temp_dir/package.json" << EOF
{
  "name": "${function_name}",
  "version": "1.0.0",
  "description": "Golf Playgroups ${function_name} Lambda function",
  "main": "index.js",
  "dependencies": {}
}
EOF

    # Create ZIP file
    cd "$temp_dir"
    zip -q "../${function_name}.zip" index.js package.json
    cd ..

    # Clean up
    rm -rf "$temp_dir"
}

# Create placeholder ZIPs for all Lambda functions
create_placeholder_lambda "users"
create_placeholder_lambda "playgroups"
create_placeholder_lambda "sessions"
create_placeholder_lambda "foursomes"
create_placeholder_lambda "scores"

echo ""
echo "Step 2: Initializing Terraform..."
echo ""

terraform init

echo ""
echo "=================================================="
echo "Setup Complete!"
echo "=================================================="
echo ""
echo "Next steps:"
echo "  1. Review the Terraform plan:    terraform plan"
echo "  2. Deploy the infrastructure:    terraform apply"
echo "  3. View outputs after deploy:    terraform output"
echo ""
echo "Important: Save the outputs for your frontend configuration!"
echo ""
