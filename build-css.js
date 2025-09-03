import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Get current directory for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Read all CSS files from src/styles and concatenate them
const stylesDir = path.join(__dirname, 'src', 'styles');
const distDir = path.join(__dirname, 'dist');

// Ensure dist directory exists
if (!fs.existsSync(distDir)) {
  fs.mkdirSync(distDir, { recursive: true });
}

// Function to resolve @import statements recursively
function resolveImports(cssContent, currentDir) {
  const importRegex = /@import\s+['"](\.\/[^'"]+)['"];/g;
  
  return cssContent.replace(importRegex, (match, importPath) => {
    try {
      const resolvedPath = path.resolve(currentDir, importPath);
      if (fs.existsSync(resolvedPath)) {
        const importedContent = fs.readFileSync(resolvedPath, 'utf8');
        // Add a comment to show where this content came from
        const comment = `\n/* === ${path.basename(resolvedPath)} === */\n`;
        // Recursively resolve imports in the imported file
        return comment + resolveImports(importedContent, path.dirname(resolvedPath)) + '\n';
      } else {
        console.warn(`Warning: Could not resolve import: ${importPath}`);
        return `\n/* Could not resolve import: ${importPath} */\n`;
      }
    } catch (error) {
      console.warn(`Warning: Error processing import ${importPath}:`, error.message);
      return `\n/* Error processing import: ${importPath} */\n`;
    }
  });
}

// Read main CSS file and resolve all imports
const mainCSSPath = path.join(stylesDir, 'tablix.css');
let mainCSS = fs.readFileSync(mainCSSPath, 'utf8');

// Resolve all @import statements
const resolvedCSS = resolveImports(mainCSS, stylesDir);

// Create combined CSS with header
const combinedCSS = `/**
 * TablixJS CSS Bundle
 * Complete styles for TablixJS table library
 * All @import statements have been resolved and inlined
 */

${resolvedCSS}`;

// Write combined CSS to dist
fs.writeFileSync(path.join(distDir, 'tablixjs.css'), combinedCSS);

// Read theme CSS files and copy them individually
const themesDir = path.join(stylesDir, 'themes');
if (fs.existsSync(themesDir)) {
  const themeFiles = fs.readdirSync(themesDir).filter(file => file.endsWith('.css'));
  
  themeFiles.forEach(themeFile => {
    const themeCSS = fs.readFileSync(path.join(themesDir, themeFile), 'utf8');
    const themeName = path.basename(themeFile, '.css');
    
    const themeWithHeader = `/**
 * TablixJS ${themeName.charAt(0).toUpperCase() + themeName.slice(1)} Theme
 */

${themeCSS}`;
    
    fs.writeFileSync(path.join(distDir, `tablixjs-theme-${themeName}.css`), themeWithHeader);
  });
  
  console.log('CSS files built successfully:');
  console.log('- tablixjs.css (main styles with inlined imports)');
  themeFiles.forEach(themeFile => {
    const themeName = path.basename(themeFile, '.css');
    console.log(`- tablixjs-theme-${themeName}.css`);
  });
} else {
  console.log('CSS files built successfully:');
  console.log('- tablixjs.css (main styles with inlined imports)');
  console.warn('Warning: themes directory not found');
}
