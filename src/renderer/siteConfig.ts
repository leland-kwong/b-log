export const siteConfig = {
  dayJobCompany: {
    name: 'Palo Alto Networks',
    url: 'https://www.paloaltonetworks.com/'
  },
  documentsDir: 'src/documents',
  buildDir: {
    development: '.local-dev-build',
    production: 'build'
  },
  imageBasePath: {
    development: 'assets/images',
    production:
      'https://vicenbis.sirv.com/Images/lelandkwong.com'
  }
} as const
