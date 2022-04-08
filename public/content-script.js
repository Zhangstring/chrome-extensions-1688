const crawl = async (sendResponse, page) => {
  const list = []
  var num = Number(page || $('.fui-paging-num').text())
  const searchValue = $('#alisearch-input').val()
    
  for (let i = 1; i <= num; i++) {
    $('body, html').animate({
      scrollTop: $('html').height() / 2
    }, 500);
    $('body, html').animate({
      scrollTop: $('html').height() - 200
    }, 500);
    await new Promise(resolve => setTimeout(resolve, 3000))
    $('.offer-list .space-offer-card-box').each((index, element) => {
      const title = $(element).find('.title').text()
      const price = $(element).find('.price').text()
      const companyName = $(element).find('.company-name').text()
      const link = $(element).find('.mojar-element-title a').attr('href')
      list.push({
        title,
        price,
        link,
        companyName
      })
    })
    if(i < num) {
      document.querySelector('.fui-next').click()
      await new Promise(resolve => setTimeout(resolve, 3000))
    }
  }
  sendResponse({
    list,
    searchValue
  })
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  const { page } = message
  crawl(sendResponse, page)
  return true
})