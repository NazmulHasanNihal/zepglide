# --- Zepglide Signaling Dockerization ---
FROM node:18-alpine

# Set working directory
WORKDIR /usr/app

# Only copy package files first to optimize layer caching
COPY package*.json ./

# Install only production dependencies for a lightweight image
RUN npm install --production

# Now copy the rest of the signaling engine
COPY . .

# Hardened port for signaling
EXPOSE 3002

# Start the node
CMD ["npm", "start"]
