<?php
if (!defined('__TYPECHO_ROOT_DIR__')) exit;

/**
 * A Markdown Editor For Typecho
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
    $version = '1.0.0';
    $pluginUrl = Helper::options()->pluginUrl . '/SMEditor';
    $autoSave = Helper::options()->autoSave;
    echo
    <<<EOF
      <link rel="stylesheet" href="$pluginUrl/assets/css/SMEditor.bundle.css?version=$version" />
      <script>
        window.SMEditor = {
          autoSave: $autoSave,
        }
      </script>
      <script src="https://cdn.jsdelivr.net/npm/hyperdown@2.4.28/Parser.min.js?version=$version"></script>
      <script src="$pluginUrl/assets/js/SMEditor.bundle.js?version=$version"></script>
EOF;
  }
}
