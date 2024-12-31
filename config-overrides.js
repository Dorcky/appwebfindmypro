const path = require('path');

module.exports = function override(config, env) {
  // Ajout de l'alias '@' pour pointer vers le dossier 'src'
  config.resolve.alias = {
    ...config.resolve.alias,
    '@': path.resolve(__dirname, 'src'),
  };

  // Exemple d'ajout d'une règle pour les fichiers .md (Markdown)
  config.module.rules.push({
    test: /\.md$/, // Cibler les fichiers .md
    use: 'raw-loader', // Utiliser 'raw-loader' pour importer des fichiers .md comme chaîne de texte
  });

  return config;
};
