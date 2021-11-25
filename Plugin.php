<?php
if (!defined('__TYPECHO_ROOT_DIR__')) exit;

/**
 * A Markdown Editor for Typecho
 * 
 * @package SMEditor
 * @author HaoOuBa
 * @version 1.2.3
 * @link //78.al
 */

class SMEditor_Plugin implements Typecho_Plugin_Interface
{
  public static $isDev = false;
  public static $version = '1.2.3';

  /**
   * 静态资源URL
   * 
   */
  public static function _getAssetsUrl($echo = true)
  {
    $localUrl = Helper::options()->pluginUrl . '/SMEditor';
    $remoteUrl = '//cdn.jsdelivr.net/npm/typecho-editor@' . self::$version;
    if ($echo) echo self::$isDev ? $localUrl : $remoteUrl;
    else return self::$isDev ? $localUrl : $remoteUrl;
  }

  /**
   * 解析表情
   * 
   */
  public static function _parseEmotion($text)
  {
    return preg_replace_callback(
      '/\[\/([A-Z]{1}):([^\]]+)\]/',
      function ($match) {
        $emotionAssetsURL = self::_getAssetsUrl(false) . '/assets/img';
        return "<img class='sm-emotion' src='{$emotionAssetsURL}/{$match[1]}/{$match[2]}.png' />";
      },
      $text
    );
  }

  /**
   * 激活插件方法,如果激活失败,直接抛出异常
   * 
   */
  public static function activate()
  {
    Typecho_Plugin::factory('admin/write-post.php')->richEditor = array('SMEditor_Plugin', 'SMEdit');
    Typecho_Plugin::factory('admin/write-page.php')->richEditor = array('SMEditor_Plugin', 'SMEdit');
    Typecho_Plugin::factory('Widget_Abstract_Contents')->content = array('SMEditor_Plugin', 'SMContent');
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
   * 解析文章
   * 
   */
  public static function SMContent($text, $context)
  {
    $text = self::_parseEmotion($text);
    return $context->isMarkdown ? $context->markdown($text) : $context->autoP($text);
  }

  /**
   * 注入函数
   * 
   */
  public static function SMEdit()
  {

?>
    <link rel="stylesheet" href="<?php self::_getAssetsUrl(); ?>/assets/plugin/Prism/Prism.min.css">
    <link rel="stylesheet" href="<?php self::_getAssetsUrl(); ?>/assets/css/SMEditor.bundle.css" />
    <script>
      window.SMEditor = {
        // 是否开启粘贴上传
        pasteUpload: true,
        // 是否开启自动保存
        autoSave: <?php Helper::options()->autoSave(); ?>,
        // 上传地址
        uploadUrl: '<?php Helper::security()->index('/action/upload'); ?>',
        // 静态资源
        assetsURL: '<?php self::_getAssetsUrl(); ?>',
      }
    </script>
    <script src="<?php self::_getAssetsUrl(); ?>/assets/plugin/Prism/Prism.min.js"></script>
    <script src="<?php self::_getAssetsUrl(); ?>/assets/plugin/Parser/Parser.min.js"></script>
    <script src="<?php self::_getAssetsUrl(); ?>/assets/js/SMEditor.bundle.js"></script>
<?php
  }
}
