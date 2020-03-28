module.exports = {
  apps: [{
    name: 'CrawlerSynom',
    script: 'index.js',
    max_memory_restart: '250M',
    watch: true,
    args: ['--run-crawler']
  }]
};
