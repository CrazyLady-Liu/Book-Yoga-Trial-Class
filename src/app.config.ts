export default defineAppConfig({
  pages: [
    'pages/home/index',
    'pages/courses/index',
    'pages/orders/index',
    'pages/mine/index',
    'pages/login/index',
    'pages/course-detail/index',
    'pages/booking-form/index',
    'pages/booking-success/index',
    'pages/order-detail/index',
    'pages/coupons/index',
    'pages/coupon-center/index',
    'pages/favorites/index',
    'pages/my-reviews/index',
    'pages/account-settings/index',
    'pages/index/index'
  ],
  window: {
    backgroundTextStyle: 'light',
    navigationBarBackgroundColor: '#7C5CFF',
    navigationBarTitleText: '梵音瑜伽',
    navigationBarTextStyle: 'white',
    backgroundColor: '#FAFAFF',
    enablePullDownRefresh: true
  },
  tabBar: {
    color: '#9CA3AF',
    selectedColor: '#7C5CFF',
    backgroundColor: '#ffffff',
    borderStyle: 'white',
    list: [
      {
        pagePath: 'pages/home/index',
        text: '首页'
      },
      {
        pagePath: 'pages/courses/index',
        text: '课程'
      },
      {
        pagePath: 'pages/orders/index',
        text: '预约'
      },
      {
        pagePath: 'pages/mine/index',
        text: '我的'
      }
    ]
  }
})
