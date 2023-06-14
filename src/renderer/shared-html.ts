import { siteConfig } from './siteConfig'

export const headContent = /* html */ `
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Geologica:wght@400;700&family=JetBrains+Mono:wght@400;700&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="styles/base.css" />
  <link rel="stylesheet" href="styles/header.css" />
  <link rel="stylesheet" href="styles/footer.css" />
  <link rel="icon"
        type="image/png"
        href="assets/favicons/favicon.ico">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <script src="https://scripts.sirv.com/sirvjs/v3/sirv.js"></script>
`
export const header = /* html */ `
  <header class="header">
    <div class="innerContainer headerInnerContainer">
      <a href="index.html" class="headerLink navLink navLogo">L K</a>
      <div class="headerRightColumn">
        <a href="https://github.com/leland-kwong" class="headerLink">
          <i class="font-icon fa-brands fa-github"></i>
        </a>
      </div>
    </div>
  </header>
`
export const footer = /* html */ `
  <footer class="footer">
    <div class="innerContainer">
      <div class="aboutMe footerSection">
        <div class="aboutMeImage">
          <img class="Sirv" data-src="https://vicenbis.sirv.com/Images/lelandkwong.com/lelandkwong-1.jpeg" alt="">
        </div>
        <div class="aboutMeText">
          <div class="aboutMeHello">Hello! My name is Leland Kwong. I work at <a href="${siteConfig.dayJobCompany.url}">${siteConfig.dayJobCompany.name}</a> as a software engineer.</div>
          <p>I believe the best digital products involve a great user experience, tasteful design, and high-quality code.</p>
        </div>
      </div>
      <div class="footerSection">
        <div class="fontSmall">This site was deployed with <a href="https://vercel.com/">Vercel</a> and statically generated with a homebrew system.</div>
        </div>
      </div>
    </div>
  </footer>
`
