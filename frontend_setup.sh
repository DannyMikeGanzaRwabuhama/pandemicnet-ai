#!/bin/bash

# PandemicNet AI - Phase 2 Frontend Setup
# Run this from your project root directory

echo "🚀 Setting up PandemicNet AI Frontend (Phase 2)"
echo "================================================"

# Step 1: Create Next.js app
echo "📦 Creating Next.js application..."
npx create-next-app@latest frontend \
  --typescript \
  --tailwind \
  --app \
  --src-dir \
  --import-alias "@/*" \
  --no-git

cd frontend

# Step 2: Install core dependencies
echo "📚 Installing dependencies..."
npm install \
  d3 \
  @types/d3 \
  leaflet \
  react-leaflet \
  @types/leaflet \
  axios \
  @tanstack/react-query \
  zustand \
  date-fns \
  recharts \
  lucide-react \
  clsx \
  tailwind-merge

# Step 3: Install shadcn/ui
echo "🎨 Setting up shadcn/ui..."
npx shadcn@latest init -y

# Step 4: Add shadcn components
echo "🧩 Adding UI components..."
npx shadcn@latest add card button input select badge alert tabs separator scroll-area dialog dropdown-menu

# Step 5: Create directory structure
echo "📁 Creating directory structure..."
mkdir -p src/lib
mkdir -p src/hooks
mkdir -p src/components/network
mkdir -p src/components/map
mkdir -p src/components/dashboard
mkdir -p src/components/trace
mkdir -p src/app/network
mkdir -p src/app/map
mkdir -p src/app/trace
mkdir -p src/app/analytics

# Step 6: Create environment file
echo "⚙️ Creating environment configuration..."
cat > .env.local << 'EOF'
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_WS_URL=ws://localhost:8000
EOF

echo ""
echo "✅ Setup complete!"
echo ""
echo "📋 Next steps:"
echo "1. cd frontend"
echo "2. Review the generated files"
echo "3. Run 'npm run dev' to start development server"
echo "4. Backend should be running at http://localhost:8000"
echo ""
echo "🎯 Ready to build the visualization layer!"