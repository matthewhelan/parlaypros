# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo "npm is not installed. Please install it first."
    exit 1
fi

# Check if Python is installed
if ! command -v python3 &> /dev/null; then
    echo "Python is not installed. Please install it first."
    exit 1
fi

# Navigate to the sse-server directory and run npm install
cd sse-server
npm install

# Start the npm application
npm start &

# Save the PID of the npm process
NPM1_PID=$!

cd ../sse-client
npm install

# Start the npm application
npm start &

# Save the PID of the npm process
NPM2_PID=$!

cd ..

python udapi.py 

python action.py

python comparator.py