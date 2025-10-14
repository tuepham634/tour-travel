const router = require('express').Router();
const multer  = require('multer');

const categoryController = require('../../controllers/admin/category.controller');
const categoryValidate = require('../../validates/admin/category.validate');
const cloudinaryHelper = require('../../helpers/cloudinary.helper');
const upload = multer({storage: cloudinaryHelper.storage});
router.get('/list',categoryController.list);
router.get('/create',categoryController.create);
router.post(
    '/create',
    upload.single('avatar'),
    categoryValidate.createPost,
    categoryController.createPost
);
router.get('/edit/:id',categoryController.edit);
router.patch(
    '/edit/:id',
    upload.single('avatar'),
    categoryValidate.createPost,
    categoryController.editPatch
)
router.get('/trash',categoryController.trash);
router.patch('/undo/:id', categoryController.undoPatch)
router.delete('/delete-destroy/:id', categoryController.deleteDestroy)
router.patch('/delete/:id',categoryController.deletePatch);
router.patch('/change-multi',categoryController.changeMultiPatch);
router.patch('/trash/change-multi', categoryController.trashChangeMultiPatch)
module.exports = router;
