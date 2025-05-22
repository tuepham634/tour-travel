const router = require('express').Router();
const homeRoutes = require('./home.route');
const tourRoutes = require('./tour.route');
const cartRoutes = require('./cart.route');

const SettingMiddleware = require("../../middlewares/client/setting.middleware");
const CategoryMiddleware = require("../../middlewares/client/category.middleware");
router.use(SettingMiddleware.websiteInfo);
router.use(CategoryMiddleware.list);
router.use('/', homeRoutes);
router.use('/tours', tourRoutes);
router.use('/cart', cartRoutes);



module.exports = router;