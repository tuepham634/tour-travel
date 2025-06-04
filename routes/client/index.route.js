const router = require('express').Router();
const homeRoutes = require('./home.route');
const tourRoutes = require('./tour.route');
const cartRoutes = require('./cart.route');
const contactRoutes = require("./contact.route");
const categoryRoutes = require("./category.route");
const searchRoutes = require("./search.route");

const SettingMiddleware = require("../../middlewares/client/setting.middleware");
const CategoryMiddleware = require("../../middlewares/client/category.middleware");
router.use(SettingMiddleware.websiteInfo);
router.use(CategoryMiddleware.list);
router.use('/', homeRoutes);
router.use('/tour', tourRoutes);
router.use('/cart', cartRoutes);
router.use('/contact', contactRoutes);
router.use('/category',categoryRoutes);
router.use('/search',searchRoutes);





module.exports = router;