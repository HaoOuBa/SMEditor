<?php
if (!defined('__TYPECHO_ROOT_DIR__')) exit;

/**
 * A Markdown Editor for Typecho
 * 
 * @package SMEditor
 * @author HaoOuBa
 * @version 1.0.0
 * @link //78.al
 */

class SMEditor_Plugin implements Typecho_Plugin_Interface
{
  /**
   * 激活插件方法,如果激活失败,直接抛出异常
   * 
   */
  public static function activate()
  {
    Typecho_Plugin::factory('admin/write-post.php')->richEditor = array('SMEditor_Plugin', 'SMEdit');
    Typecho_Plugin::factory('admin/write-page.php')->richEditor = array('SMEditor_Plugin', 'SMEdit');
  }

  /**
   * 禁用插件方法,如果禁用失败,直接抛出异常
   * 
   */
  public static function deactivate()
  {
  }


  /**
   * 获取插件配置面板
   * 
   */
  public static function config(Typecho_Widget_Helper_Form $form)
  {
  }

  /**
   * 个人用户的配置面板
   * 
   */
  public static function personalConfig(Typecho_Widget_Helper_Form $form)
  {
  }

  /**
   * 注入函数
   * 
   */
  public static function SMEdit()
  {
    $isDev = false;
    $version = '1.0.8';
    $cdnURL = '//cdn.jsdelivr.net/npm/typecho-editor@' . $version;
    $localURL = Helper::options()->pluginUrl . '/SMEditor';
?>
    <link rel="stylesheet" href="//cdn.jsdelivr.net/npm/prism-themes@1.7.0/themes/prism-nord.min.css">
    <link rel="stylesheet" href="<?php echo $isDev ? $localURL : $cdnURL; ?>/assets/css/SMEditor.bundle.css" />
    <script>
      window.SMEditor = {
        // 是否开启粘贴上传
        pasteUpload: true,
        // 是否开启自动保存
        autoSave: <?php Helper::options()->autoSave(); ?>,
        // 上传地址
        uploadUrl: '<?php Helper::security()->index('/action/upload'); ?>',
      }
    </script>
    <script src="<?php echo $isDev ? $localURL : $cdnURL; ?>/assets/plugin/Prism/Prism.min.js"></script>
    <script src="<?php echo $isDev ? $localURL : $cdnURL; ?>/assets/plugin/Parser/Parser.min.js"></script>
    <script src="<?php echo $isDev ? $localURL : $cdnURL; ?>/assets/js/SMEditor.bundle.js"></script>
<?php
  }
}
