(function () {
  var Parser;

  Parser = (function () {
    var array_keys, array_values, htmlspecialchars, preg_quote, str_replace, trim, ucfirst;

    class Parser {

      constructor() {
        this.commonWhiteList = 'kbd|b|i|strong|em|sup|sub|br|code|del|a|hr|small';
        this.blockHtmlTags = 'p|div|h[1-6]|blockquote|pre|table|dl|ol|ul|address|form|fieldset|iframe|hr|legend|article|section|nav|aside|hgroup|header|footer|figcaption|svg|script|noscript';
        this.specialWhiteList = {
          table: 'table|tbody|thead|tfoot|tr|td|th'
        };
        this.hooks = {};
        this.html = false;
        this.line = false;
        this.blockParsers = [['code', 10], ['shtml', 20], ['pre', 30], ['ahtml', 40], ['shr', 50], ['list', 60], ['math', 70], ['html', 80], ['footnote', 90], ['definition', 100], ['quote', 110], ['table', 120], ['sh', 130], ['mh', 140], ['dhr', 150], ['default', 9999]];
        this.parsers = {};
      }


      // parse markdown text
      makeHtml(text) {
        var html, j, len, name, parser, ref;
        this.footnotes = [];
        this.definitions = {};
        this.holders = {};
        this.uniqid = (Math.ceil(Math.random() * 10000000)) + (Math.ceil(Math.random() * 10000000));
        this.id = 0;
        this.blockParsers.sort(function (a, b) {
          if (a[1] < b[1]) {
            return -1;
          } else {
            return 1;
          }
        });
        ref = this.blockParsers;
        for (j = 0, len = ref.length; j < len; j++) {
          parser = ref[j];
          [name] = parser;
          if (parser[2] !== void 0) {
            this.parsers[name] = parser[2];
          } else {
            this.parsers[name] = this['parseBlock' + (ucfirst(name))].bind(this);
          }
        }
        text = this.initText(text);
        html = this.parse(text);
        html = this.makeFootnotes(html);
        html = this.optimizeLines(html);
        return this.call('makeHtml', html);
      }

      enableHtml(html1 = true) {
        this.html = html1;
      }

      enableLine(line1 = true) {
        this.line = line1;
      }

      hook(type, cb) {
        if (this.hooks[type] == null) {
          this.hooks[type] = [];
        }
        return this.hooks[type].push(cb);
      }

      makeHolder(str) {
        var key;
        key = "|\r" + this.uniqid + this.id + "\r|";
        this.id += 1;
        this.holders[key] = str;
        return key;
      }

      // clear all special chars
      initText(text) {
        return text.replace(/\t/g, '    ').replace(/\r/g, '').replace(/(\u000A|\u000D|\u2028|\u2029)/g, "\n");
      }

      makeFootnotes(html) {
        var index, val;
        if (this.footnotes.length > 0) {
          html += '<div class="footnotes"><hr><ol>';
          index = 1;
          while (val = this.footnotes.shift()) {
            if (typeof val === 'string') {
              val += ` <a href=\"#fnref-${index}\" class=\"footnote-backref\">&#8617;</a>`;
            } else {
              val[val.length - 1] += ` <a href=\"#fnref-${index}\" class=\"footnote-backref\">&#8617;</a>`;
              val = val.length > 1 ? this.parse(val.join("\n")) : this.parseInline(val[0]);
            }
            html += `<li id=\"fn-${index}\">${val}</li>`;
            index += 1;
          }
          html += '</ol></div>';
        }
        return html;
      }

      // parse text
      parse(text, inline = false, offset = 0) {
        var block, blocks, end, extract, html, j, len, lines, method, result, start, type, value;
        lines = []; // array ref
        blocks = this.parseBlock(text, lines);
        html = '';
        // inline mode for single normal block
        if (inline && blocks.length === 1 && blocks[0][0] === 'normal') {
          blocks[0][3] = true;
        }
        for (j = 0, len = blocks.length; j < len; j++) {
          block = blocks[j];
          [type, start, end, value] = block;
          extract = lines.slice(start, end + 1);
          method = 'parse' + ucfirst(type);
          extract = this.call('before' + ucfirst(method), extract, value);
          result = this[method](extract, value, start + offset, end + offset);
          result = this.call('after' + ucfirst(method), result, value);
          html += result;
        }
        return html;
      }

      // call hook
      call(type, ...args) {
        var callback, j, len, ref, value;
        [value] = args;
        if (this.hooks[type] == null) {
          return value;
        }
        ref = this.hooks[type];
        for (j = 0, len = ref.length; j < len; j++) {
          callback = ref[j];
          value = callback.apply(this, args);
          args[0] = value;
        }
        return value;
      }

      // release holder
      releaseHolder(text, clearHolders = true) {
        var deep;
        deep = 0;
        while ((text.indexOf("\r")) >= 0 && deep < 10) {
          text = str_replace(array_keys(this.holders), array_values(this.holders), text);
          deep += 1;
        }
        if (clearHolders) {
          this.holders = {};
        }
        return text;
      }

      // mark line
      markLine(start, end = -1) {
        if (this.line) {
          end = end < 0 ? start : end;
          return '<span class="line" data-start="' + start + '" data-end="' + end + '" data-id="' + this.uniqid + '"></span>';
        }
        return '';
      }


      // mark lines
      markLines(lines, start) {
        var i;
        i = -1;
        if (this.line) {
          return lines.map((line) => {
            i += 1;
            return (this.markLine(start + i)) + line;
          });
        } else {
          return lines;
        }
      }

      // optimize lines
      optimizeLines(html) {
        var last, regex;
        last = 0;
        regex = new RegExp(`class=\"line\" data\\-start=\"([0-9]+)\" data\\-end=\"([0-9]+)\" (data\\-id=\"${this.uniqid}\")`, 'g');
        if (this.line) {
          return html.replace(regex, function (...matches) {
            var replace;
            if (last !== parseInt(matches[1])) {
              replace = 'class="line" data-start="' + last + '" data-start-original="' + matches[1] + '" data-end="' + matches[2] + '" ' + matches[3];
            } else {
              replace = matches[0];
            }
            last = 1 + parseInt(matches[2]);
            return replace;
          });
        } else {
          return html;
        }
      }

      // parse inline
      parseInline(text, whiteList = '', clearHolders = true, enableAutoLink = true) {
        text = this.call('beforeParseInline', text);

        // code
        text = text.replace(/(^|[^\\])(`+)(.+?)\2/mg, (...matches) => {
          return matches[1] + this.makeHolder('<code>' + (htmlspecialchars(matches[3])) + '</code>');
        });

        // mathjax
        text = text.replace(/(^|[^\\])(\$+)(.+?)\2/mg, (...matches) => {
          return matches[1] + this.makeHolder(matches[2] + (htmlspecialchars(matches[3])) + matches[2]);
        });
        // escape
        text = text.replace(/\\(.)/g, (...matches) => {
          var escaped, prefix;
          prefix = matches[1].match(/^[-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]$/) ? '' : '\\';
          escaped = htmlspecialchars(matches[1]);
          escaped = escaped.replace(/\$/g, '&dollar;');
          return this.makeHolder(prefix + escaped);
        });

        // link
        text = text.replace(/<(https?:\/\/.+|(?:mailto:)?[_a-z0-9-\.\+]+@[_\w-]+(?:\.[a-z]{2,})+)>/ig, (...matches) => {
          var link, url;
          url = this.cleanUrl(matches[1]);
          link = this.call('parseLink', url);
          return this.makeHolder(`<a href=\"${url}\">${link}</a>`);
        });
        // encode unsafe tags
        text = text.replace(/<(\/?)([a-z0-9-]+)(\s+[^>]*)?>/ig, (...matches) => {
          if (this.html || (('|' + this.commonWhiteList + '|' + whiteList + '|').indexOf('|' + matches[2].toLowerCase() + '|')) >= 0) {
            return this.makeHolder(matches[0]);
          } else {
            return this.makeHolder(htmlspecialchars(matches[0]));
          }
        });
        if (this.html) {
          text = text.replace(/<!\-\-(.*?)\-\->/g, (...matches) => {
            return this.makeHolder(matches[0]);
          });
        }
        text = str_replace(['<', '>'], ['&lt;', '&gt;'], text);
        // footnote
        text = text.replace(/\[\^((?:[^\]]|\\\]|\\\[)+?)\]/g, (...matches) => {
          var id;
          id = this.footnotes.indexOf(matches[1]);
          if (id < 0) {
            id = this.footnotes.length + 1;
            this.footnotes.push(this.parseInline(matches[1], '', false));
          }
          return this.makeHolder(`<sup id=\"fnref-${id}\"><a href=\"#fn-${id}\" class=\"footnote-ref\">${id}</a></sup>`);
        });
        // image
        text = text.replace(/!\[((?:[^\]]|\\\]|\\\[)*?)\]\(((?:[^\)]|\\\)|\\\()+?)\)/g, (...matches) => {
          var escaped, title, url;
          escaped = htmlspecialchars(this.escapeBracket(matches[1]));
          url = this.escapeBracket(matches[2]);
          [url, title] = this.cleanUrl(url, true);
          title = title == null ? escaped : ` title=\"${title}\"`;
          return this.makeHolder(`<img src=\"${url}\" alt=\"${title}\" title=\"${title}\">`);
        });
        text = text.replace(/!\[((?:[^\]]|\\\]|\\\[)*?)\]\[((?:[^\]]|\\\]|\\\[)+?)\]/g, (...matches) => {
          var escaped, result;
          escaped = htmlspecialchars(this.escapeBracket(matches[1]));
          result = this.definitions[matches[2]] != null ? `<img src=\"${this.definitions[matches[2]]}\" alt=\"${escaped}\" title=\"${escaped}\">` : escaped;
          return this.makeHolder(result);
        });
        // link
        text = text.replace(/\[((?:[^\]]|\\\]|\\\[)+?)\]\(((?:[^\)]|\\\)|\\\()+?)\)/g, (...matches) => {
          var escaped, title, url;
          escaped = this.parseInline(this.escapeBracket(matches[1]), '', false, false);
          url = this.escapeBracket(matches[2]);
          [url, title] = this.cleanUrl(url, true);
          title = title == null ? '' : ` title=\"${title}\"`;
          return this.makeHolder(`<a href=\"${url}\"${title}>${escaped}</a>`);
        });
        text = text.replace(/\[((?:[^\]]|\\\]|\\\[)+?)\]\[((?:[^\]]|\\\]|\\\[)+?)\]/g, (...matches) => {
          var escaped, result;
          escaped = this.parseInline(this.escapeBracket(matches[1]), '', false, false);
          result = this.definitions[matches[2]] != null ? `<a href=\"${this.definitions[matches[2]]}\">${escaped}</a>` : escaped;
          return this.makeHolder(result);
        });
        // strong and em and some fuck
        text = this.parseInlineCallback(text);
        // autolink url
        if (enableAutoLink) {
          text = text.replace(/(^|[^\"])(https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\b([-a-zA-Z0-9@:%_\+.~#?&\/=]*)|(?:mailto:)?[_a-z0-9-\.\+]+@[_\w-]+(?:\.[a-z]{2,})+)($|[^\"])/g, (...matches) => {
            var link, url;
            url = this.cleanUrl(matches[2]);
            link = this.call('parseLink', matches[2]);
            return `${matches[1]}<a href=\"${url}\">${link}</a>${matches[5]}`;
          });
        }
        text = this.call('afterParseInlineBeforeRelease', text);
        text = this.releaseHolder(text, clearHolders);
        text = this.call('afterParseInline', text);
        return text;
      }

      parseInlineCallback(text) {
        text = text.replace(/(\*{3})((?:.|\r)+?)\1/mg, (...matches) => {
          return '<strong><em>' + (this.parseInlineCallback(matches[2])) + '</em></strong>';
        });
        text = text.replace(/(\*{2})((?:.|\r)+?)\1/mg, (...matches) => {
          return '<strong>' + (this.parseInlineCallback(matches[2])) + '</strong>';
        });
        text = text.replace(/(\*)((?:.|\r)+?)\1/mg, (...matches) => {
          return '<em>' + (this.parseInlineCallback(matches[2])) + '</em>';
        });
        text = text.replace(/(\s+|^)(_{3})((?:.|\r)+?)\2(\s+|$)/mg, (...matches) => {
          return matches[1] + '<strong><em>' + (this.parseInlineCallback(matches[3])) + '</em></strong>' + matches[4];
        });
        text = text.replace(/(\s+|^)(_{2})((?:.|\r)+?)\2(\s+|$)/mg, (...matches) => {
          return matches[1] + '<strong>' + (this.parseInlineCallback(matches[3])) + '</strong>' + matches[4];
        });
        text = text.replace(/(\s+|^)(_)((?:.|\r)+?)\2(\s+|$)/mg, (...matches) => {
          return matches[1] + '<em>' + (this.parseInlineCallback(matches[3])) + '</em>' + matches[4];
        });
        text = text.replace(/(~{2})((?:.|\r)+?)\1/mg, (...matches) => {
          return '<del>' + (this.parseInlineCallback(matches[2])) + '</del>';
        });
        return text;
      }

      // parse block
      parseBlock(text, lines) {
        var block, j, key, l, len, len1, line, name, parser, pass, ref, ref1, state;
        ref = text.split("\n");
        for (j = 0, len = ref.length; j < len; j++) {
          line = ref[j];
          lines.push(line);
        }
        this.blocks = [];
        this.current = 'normal';
        this.pos = -1;
        state = {
          special: (array_keys(this.specialWhiteList)).join('|'),
          empty: 0,
          html: false
        };
        for (key = l = 0, len1 = lines.length; l < len1; key = ++l) {
          line = lines[key];
          block = this.getBlock();
          if (block != null) {
            block = block.slice(0);
          }
          if (this.current !== 'normal') {
            pass = this.parsers[this.current](block, key, line, state, lines);
            if (!pass) {
              continue;
            }
          }
          ref1 = this.parsers;
          for (name in ref1) {
            parser = ref1[name];
            if (name !== this.current) {
              pass = parser(block, key, line, state, lines);
              if (!pass) {
                break;
              }
            }
          }
        }
        return this.optimizeBlocks(this.blocks, lines);
      }

      parseBlockList(block, key, line, state) {
        var matches, space, tab, type;
        // list 
        if ((this.isBlock('list')) && !line.match(/^\s*\[((?:[^\]]|\\\]|\\\[)+?)\]:\s*(.+)$/)) {
          if (!!(line.match(/^(\s*)(~{3,}|`{3,})([^`~]*)$/i))) {
            // ignore code
            return true;
          } else if ((state.empty <= 1) && !!(matches = line.match(/^(\s*)\S+/)) && matches[1].length >= (block[3][0] + state.empty)) {
            state.empty = 0;
            this.setBlock(key);
            return false;
          } else if ((line.match(/^\s*$/)) && state.empty === 0) {
            state.empty += 1;
            this.setBlock(key);
            return false;
          }
        }
        if (!!(matches = line.match(/^(\s*)((?:[0-9]+\.)|\-|\+|\*)\s+/i))) {
          space = matches[1].length;
          tab = matches[0].length - space;
          state.empty = 0;
          type = 0 <= '+-*'.indexOf(matches[2]) ? 'ul' : 'ol';
          // opened
          if (this.isBlock('list')) {
            if (space < block[3][0] || (space === block[3][0] && type !== block[3][1])) {
              this.startBlock('list', key, [space, type, tab]);
            } else {
              this.setBlock(key);
            }
          } else {
            this.startBlock('list', key, [space, type, tab]);
          }
          return false;
        }
        return true;
      }

      parseBlockCode(block, key, line, state) {
        var isAfterList, matches, space;
        if (!!(matches = line.match(/^(\s*)(~{3,}|`{3,})([^`~]*)$/i))) {
          if (this.isBlock('code')) {
            if (state.code !== matches[2]) {
              this.setBlock(key);
              return false;
            }
            isAfterList = block[3][2];
            if (isAfterList) {
              state.empty = 0;
              this.combineBlock().setBlock(key);
            } else {
              (this.setBlock(key)).endBlock();
            }
          } else {
            isAfterList = false;
            if (this.isBlock('list')) {
              space = block[3][0];
              isAfterList = matches[1].length >= space + state.empty;
            }
            state.code = matches[2];
            this.startBlock('code', key, [matches[1], matches[3], isAfterList]);
          }
          return false;
        } else if (this.isBlock('code')) {
          this.setBlock(key);
          return false;
        }
        return true;
      }

      parseBlockShtml(block, key, line, state) {
        var matches;
        if (!!(matches = line.match(/^(\s*)!!!(\s*)$/))) {
          if (this.isBlock('shtml')) {
            this.setBlock(key).endBlock();
          } else {
            this.startBlock('shtml', key);
          }
          return false;
        } else if (this.isBlock('shtml')) {
          this.setBlock(key);
          return false;
        }
        return true;
      }

      parseBlockAhtml(block, key, line, state) {
        var htmlTagAllRegExp, htmlTagRegExp, lastMatch, m, matches;
        if (this.html) {
          htmlTagRegExp = new RegExp(`^\\s*<(${this.blockHtmlTags})(\\s+[^>]*)?>`, 'i');
          if (matches = line.match(htmlTagRegExp)) {
            if (this.isBlock('ahtml')) {
              this.setBlock(key);
              return false;
            } else if (matches[2] === void 0 || matches[2] !== '/') {
              this.startBlock('ahtml', key);
              htmlTagAllRegExp = new RegExp(`\\s*<(${this.blockHtmlTags})(\\s+[^>]*)?>`, 'ig');
              while (true) {
                m = htmlTagAllRegExp.exec(line);
                if (!m) {
                  break;
                }
                lastMatch = m[1];
              }
              if (0 <= line.indexOf(`</${lastMatch}>`)) {
                this.endBlock();
              } else {
                state.html = lastMatch;
              }
              return false;
            }
          } else if (!!state.html && 0 <= line.indexOf(`</${state.html}>`)) {
            this.setBlock(key).endBlock();
            state.html = false;
            return false;
          } else if (this.isBlock('ahtml')) {
            this.setBlock(key);
            return false;
          } else if (!!(matches = line.match(/^\s*<!\-\-(.*?)\-\->\s*$/))) {
            this.startBlock('ahtml', key).endBlock();
            return false;
          }
        }
        return true;
      }

      parseBlockMath(block, key, line) {
        var matches;
        if (!!(matches = line.match(/^(\s*)\$\$(\s*)$/))) {
          if (this.isBlock('math')) {
            this.setBlock(key).endBlock();
          } else {
            this.startBlock('math', key);
          }
          return false;
        } else if (this.isBlock('math')) {
          this.setBlock(key);
          return false;
        }
        return true;
      }

      parseBlockPre(block, key, line, state) {
        if (!!(line.match(/^ {4}/))) {
          if (this.isBlock('pre')) {
            this.setBlock(key);
          } else {
            this.startBlock('pre', key);
          }
          return false;
        } else if ((this.isBlock('pre')) && line.match(/^\s*$/)) {
          this.setBlock(key);
          return false;
        }
        return true;
      }

      parseBlockHtml(block, key, line, state) {
        var matches, tag;
        if (!!(matches = line.match(new RegExp(`^\\s*<(${state.special})(\\s+[^>]*)?>`, 'i')))) {
          tag = matches[1].toLowerCase();
          if (!(this.isBlock('html', tag)) && !(this.isBlock('pre'))) {
            this.startBlock('html', key, tag);
          }
          return false;
        } else if (!!(matches = line.match(new RegExp(`</(${state.special})>\\s*$`, 'i')))) {
          tag = matches[1].toLowerCase();
          if (this.isBlock('html', tag)) {
            this.setBlock(key).endBlock();
          }
          return false;
        } else if (this.isBlock('html')) {
          this.setBlock(key);
          return false;
        }
        return true;
      }

      parseBlockFootnote(block, key, line) {
        var matches, space;
        if (!!(matches = line.match(/^\[\^((?:[^\]]|\\\]|\\\[)+?)\]:/))) {
          space = matches[0].length - 1;
          this.startBlock('footnote', key, [space, matches[1]]);
          return false;
        }
        return true;
      }

      parseBlockDefinition(block, key, line) {
        var matches;
        if (!!(matches = line.match(/^\s*\[((?:[^\]]|\\\]|\\\[)+?)\]:\s*(.+)$/))) {
          this.definitions[matches[1]] = this.cleanUrl(matches[2]);
          this.startBlock('definition', key).endBlock();
          return false;
        }
        return true;
      }

      parseBlockQuote(block, key, line) {
        var matches;
        if (!!(matches = line.match(/^(\s*)>/))) {
          if ((this.isBlock('list')) && matches[1].length > 0) {
            this.setBlock(key);
          } else if (this.isBlock('quote')) {
            this.setBlock(key);
          } else {
            this.startBlock('quote', key);
          }
          return false;
        }
        return true;
      }

      parseBlockTable(block, key, line, state, lines) {
        var align, aligns, head, j, len, matches, row, rows;
        if (!!(matches = line.match(/^((?:(?:(?:\||\+)(?:[ :]*\-+[ :]*)(?:\||\+))|(?:(?:[ :]*\-+[ :]*)(?:\||\+)(?:[ :]*\-+[ :]*))|(?:(?:[ :]*\-+[ :]*)(?:\||\+))|(?:(?:\||\+)(?:[ :]*\-+[ :]*)))+)$/))) {
          if (this.isBlock('table')) {
            block[3][0].push(block[3][2]);
            block[3][2] += 1;
            this.setBlock(key, block[3]);
          } else {
            head = 0;
            if ((block == null) || block[0] !== 'normal' || lines[block[2]].match(/^\s*$/)) {
              this.startBlock('table', key);
            } else {
              head = 1;
              this.backBlock(1, 'table');
            }
            if (matches[1][0] === '|') {
              matches[1] = matches[1].substring(1);
              if (matches[1][matches[1].length - 1] === '|') {
                matches[1] = matches[1].substring(0, matches[1].length - 1);
              }
            }
            rows = matches[1].split(/\+|\|/);
            aligns = [];
            for (j = 0, len = rows.length; j < len; j++) {
              row = rows[j];
              align = 'none';
              if (!!(matches = row.match(/^\s*(:?)\-+(:?)\s*$/))) {
                if (!!matches[1] && !!matches[2]) {
                  align = 'center';
                } else if (!!matches[1]) {
                  align = 'left';
                } else if (!!matches[2]) {
                  align = 'right';
                }
              }
              aligns.push(align);
            }
            this.setBlock(key, [[head], aligns, head + 1]);
          }
          return false;
        }
        return true;
      }

      parseBlockSh(block, key, line) {
        var matches, num;
        if (!!(matches = line.match(/^(#+)(.*)$/))) {
          num = Math.min(matches[1].length, 6);
          this.startBlock('sh', key, num).endBlock();
          return false;
        }
        return true;
      }

      parseBlockMh(block, key, line, state, lines) {
        var matches;
        if (!!(matches = line.match(/^\s*((=|-){2,})\s*$/)) && ((block != null) && block[0] === 'normal' && !lines[block[2]].match(/^\s*$/))) {
          if (this.isBlock('normal')) {
            this.backBlock(1, 'mh', matches[1][0] === '=' ? 1 : 2).setBlock(key).endBlock();
          } else {
            this.startBlock('normal', key);
          }
          return false;
        }
        return true;
      }

      parseBlockShr(block, key, line) {
        if (!!(line.match(/^(\* *){3,}\s*$/))) {
          this.startBlock('hr', key).endBlock();
          return false;
        }
        return true;
      }

      parseBlockDhr(block, key, line) {
        if (!!(line.match(/^(- *){3,}\s*$/))) {
          this.startBlock('hr', key).endBlock();
          return false;
        }
        return true;
      }

      parseBlockDefault(block, key, line, state) {
        var matches;
        if (this.isBlock('footnote')) {
          matches = line.match(/^(\s*)/);
          if (matches[1].length >= block[3][0]) {
            this.setBlock(key);
          } else {
            this.startBlock('normal', key);
          }
        } else if (this.isBlock('table')) {
          if (0 <= line.indexOf('|')) {
            block[3][2] += 1;
            this.setBlock(key, block[3]);
          } else {
            this.startBlock('normal', key);
          }
        } else if (this.isBlock('quote')) {
          if (!line.match(/^(\s*)$/)) { // empty line
            this.setBlock(key);
          } else {
            this.startBlock('normal', key);
          }
        } else {
          if ((block == null) || block[0] !== 'normal') {
            this.startBlock('normal', key);
          } else {
            this.setBlock(key);
          }
        }
        return true;
      }

      optimizeBlocks(_blocks, _lines) {
        var block, blocks, from, isEmpty, key, lines, moved, nextBlock, prevBlock, to, type, types;
        blocks = _blocks.slice(0);
        lines = _lines.slice(0);
        blocks = this.call('beforeOptimizeBlocks', blocks, lines);
        key = 0;
        while (blocks[key] != null) {
          moved = false;
          block = blocks[key];
          prevBlock = blocks[key - 1] != null ? blocks[key - 1] : null;
          nextBlock = blocks[key + 1] != null ? blocks[key + 1] : null;
          [type, from, to] = block;
          if ('pre' === type) {
            isEmpty = (lines.slice(block[1], block[2] + 1)).reduce(function (result, line) {
              return (line.match(/^\s*$/)) && result;
            }, true);
            if (isEmpty) {
              block[0] = type = 'normal';
            }
          }
          if ('normal' === type) {
            types = ['list', 'quote'];
            if (from === to && (lines[from].match(/^\s*$/)) && (prevBlock != null) && (nextBlock != null)) {
              if (prevBlock[0] === nextBlock[0] && (types.indexOf(prevBlock[0])) >= 0 && (prevBlock[0] !== 'list' || (prevBlock[3][0] === nextBlock[3][0] && prevBlock[3][1] === nextBlock[3][1]))) {
                // combine 3 blocks
                blocks[key - 1] = [prevBlock[0], prevBlock[1], nextBlock[2], prevBlock[3] != null ? prevBlock[3] : null];
                blocks.splice(key, 2);
                // do not move
                moved = true;
              }
            }
          }
          if (!moved) {
            key += 1;
          }
        }
        return this.call('afterOptimizeBlocks', blocks, lines);
      }

      parseCode(lines, parts, start) {
        var blank, count, isEmpty, lang, rel, str;
        [blank, lang] = parts;
        lang = trim(lang);
        count = blank.length;
        if (!lang.match(/^[_a-z0-9-\+\#\:\.]+$/i)) {
          lang = null;
        } else {
          parts = lang.split(':');
          if (parts.length > 1) {
            [lang, rel] = parts;
            lang = trim(lang);
            rel = trim(rel);
          }
        }
        isEmpty = true;
        lines = lines.slice(1, -1).map(function (line) {
          line = line.replace(new RegExp(`^[ ]{${count}}`), '');
          if (isEmpty && !line.match(/^\s*$/)) {
            isEmpty = false;
          }
          return htmlspecialchars(line);
        });
        str = (this.markLines(lines, start + 1)).join("\n");
        if (isEmpty) {
          return '';
        } else {
          return `<pre class="language-${lang || 'none'}"><code>${str}</code></pre>`;
        }
      }

      parsePre(lines, value, start) {
        var str;
        lines = lines.map(function (line) {
          return htmlspecialchars(line.substring(4));
        });
        str = (this.markLines(lines, start)).join("\n");
        if (str.match(/^\s*$/)) {
          return '';
        } else {
          return '<pre><code>' + str + '</code></pre>';
        }
      }

      parseAhtml(lines, value, start) {
        return trim((this.markLines(lines, start)).join("\n"));
      }

      parseShtml(lines, value, start) {
        return trim((this.markLines(lines.slice(1, -1), start + 1)).join("\n"));
      }

      parseMath(lines, value, start, end) {
        return '<p>' + (this.markLine(start, end)) + (htmlspecialchars(lines.join("\n"))) + '</p>';
      }

      parseSh(lines, num, start, end) {
        var line;
        line = (this.markLine(start, end)) + this.parseInline(trim(lines[0], '# '));
        if (line.match(/^\s*$/)) {
          return '';
        } else {
          return `<h${num}>${line}</h${num}>`;
        }
      }

      parseMh(lines, num, start, end) {
        return this.parseSh(lines, num, start, end);
      }

      parseQuote(lines, value, start) {
        var str;
        lines = lines.map(function (line) {
          return line.replace(/^\s*> ?/, '');
        });
        str = lines.join("\n");
        if (str.match(/^\s*$/)) {
          return '';
        } else {
          return '<blockquote>' + (this.parse(str, true, start)) + '</blockquote>';
        }
      }

      parseList(lines, value, start) {
        var html, j, key, l, last, len, len1, line, matches, olStart, row, rows, space, suffix, tab, type;
        html = '';
        [space, type, tab] = value;
        rows = [];
        suffix = '';
        last = 0;
        for (key = j = 0, len = lines.length; j < len; key = ++j) {
          line = lines[key];
          if (matches = line.match(new RegExp(`^(\\s{${space}})((?:[0-9]+\\.?)|\\-|\\+|\\*)(\\s+)(.*)$`))) {
            if (type === 'ol' && key === 0) {
              olStart = parseInt(matches[2]);
              if (olStart !== 1) {
                suffix = ' start="' + olStart + '"';
              }
            }
            rows.push([matches[4]]);
            last = rows.length - 1;
          } else {
            rows[last].push(line.replace(new RegExp(`^\\s{${tab + space}}`), ''));
          }
        }
        for (l = 0, len1 = rows.length; l < len1; l++) {
          row = rows[l];
          html += '<li>' + (this.parse(row.join("\n"), true, start)) + '</li>';
          start += row.length;
        }
        return `<${type}${suffix}>${html}</${type}>`;
      }

      parseTable(lines, value, start) {
        var aligns, body, column, columns, head, html, ignores, j, key, l, last, len, len1, line, num, output, row, rows, tag, text;
        [ignores, aligns] = value;
        head = ignores.length > 0 && (ignores.reduce(function (prev, curr) {
          return curr + prev;
        })) > 0;
        html = '<table>';
        body = head ? null : true;
        output = false;
        for (key = j = 0, len = lines.length; j < len; key = ++j) {
          line = lines[key];
          if (0 <= ignores.indexOf(key)) {
            if (head && output) {
              head = false;
              body = true;
            }
            continue;
          }
          line = trim(line);
          output = true;
          if (line[0] === '|') {
            line = line.substring(1);
            if (line[line.length - 1] === '|') {
              line = line.substring(0, line.length - 1);
            }
          }
          rows = line.split('|').map(function (row) {
            if (row.match(/^\s*$/)) {
              return ' ';
            } else {
              return trim(row);
            }
          });
          columns = {};
          last = -1;
          for (l = 0, len1 = rows.length; l < len1; l++) {
            row = rows[l];
            if (row.length > 0) {
              last += 1;
              columns[last] = [(columns[last] != null ? columns[last][0] + 1 : 1), row];
            } else if (columns[last] != null) {
              columns[last][0] += 1;
            } else {
              columns[0] = [1, row];
            }
          }
          if (head) {
            html += '<thead>';
          } else if (body) {
            html += '<tbody>';
          }
          html += '<tr';
          if (this.line) {
            html += ' class="line" data-start="' + (start + key) + '" data-end="' + (start + key) + '" data-id="' + this.uniqid + '"';
          }
          html += '>';
          for (key in columns) {
            column = columns[key];
            [num, text] = column;
            tag = head ? 'th' : 'td';
            html += `<${tag}`;
            if (num > 1) {
              html += ` colspan=\"${num}\"`;
            }
            if ((aligns[key] != null) && aligns[key] !== 'none') {
              html += ` align=\"${aligns[key]}\"`;
            }
            html += '>' + (this.parseInline(text)) + `</${tag}>`;
          }
          html += '</tr>';
          if (head) {
            html += '</thead>';
          } else if (body) {
            body = false;
          }
        }
        if (body !== null) {
          html += '</tbody>';
        }
        return html += '</table>';
      }

      parseHr(lines, value, start) {
        if (this.line) {
          return '<hr class="line" data-start="' + start + '" data-end="' + start + '">';
        } else {
          return '<hr>';
        }
      }

      parseNormal(lines, inline, start) {
        var key, str;
        key = 0;
        lines = lines.map((line) => {
          line = this.parseInline(line);
          if (!line.match(/^\s*$/)) {
            line = (this.markLine(start + key)) + line;
          }
          key += 1;
          return line;
        });
        str = trim(lines.join("\n"));
        str = str.replace(/(\n\s*){2,}/g, () => {
          inline = false;
          return '</p><p>';
        });
        str = str.replace(/\n/g, '<br>');
        if (str.match(/^\s*$/)) {
          return '';
        } else {
          if (inline) {
            return str;
          } else {
            return `<p>${str}</p>`;
          }
        }
      }

      parseFootnote(lines, value) {
        var index, note, space;
        [space, note] = value;
        index = this.footnotes.indexOf(note);
        if (index >= 0) {
          lines = lines.slice(0); // clone array
          lines[0] = lines[0].replace(/^\[\^((?:[^\]]|\]|\[)+?)\]:/, '');
          this.footnotes[index] = lines;
        }
        return '';
      }

      parseDefinition() {
        return '';
      }

      parseHtml(lines, type, start) {
        lines = lines.map((line) => {
          return this.parseInline(line, this.specialWhiteList[type] != null ? this.specialWhiteList[type] : '');
        });
        return (this.markLines(lines, start)).join("\n");
      }

      cleanUrl(url, parseTitle = false) {
        var matches, pos, title;
        title = null;
        url = trim(url);
        if (parseTitle) {
          pos = url.indexOf(' ');
          if (pos >= 0) {
            title = htmlspecialchars(trim(url.substring(pos + 1), ' "\''));
            url = url.substring(0, pos);
          }
        }
        url = url.replace(/["'<>\s]/g, '');
        if (!!(matches = url.match(/^(mailto:)?[_a-z0-9-\.\+]+@[_\w-]+(?:\.[a-z]{2,})+$/i))) {
          if (matches[1] == null) {
            url = 'mailto:' + url;
          }
        }
        if ((url.match(/^\w+:/i)) && !(url.match(/^(https?|mailto):/i))) {
          return '#';
        }
        if (parseTitle) {
          return [url, title];
        } else {
          return url;
        }
      }

      escapeBracket(str) {
        return str_replace(['\\[', '\\]', '\\(', '\\)'], ['[', ']', '(', ')'], str);
      }

      startBlock(type, start, value = null) {
        this.pos += 1;
        this.current = type;
        this.blocks.push([type, start, start, value]);
        return this;
      }

      endBlock() {
        this.current = 'normal';
        return this;
      }

      isBlock(type, value = null) {
        return this.current === type && (null === value ? true : this.blocks[this.pos][3] === value);
      }

      getBlock() {
        if (this.blocks[this.pos] != null) {
          return this.blocks[this.pos];
        } else {
          return null;
        }
      }

      setBlock(to = null, value = null) {
        if (to !== null) {
          this.blocks[this.pos][2] = to;
        }
        if (value !== null) {
          this.blocks[this.pos][3] = value;
        }
        return this;
      }

      backBlock(step, type, value = null) {
        var item, last;
        if (this.pos < 0) {
          return this.startBlock(type, 0, value);
        }
        last = this.blocks[this.pos][2];
        this.blocks[this.pos][2] = last - step;
        item = [type, last - step + 1, last, value];
        if (this.blocks[this.pos][1] <= this.blocks[this.pos][2]) {
          this.pos += 1;
          this.blocks.push(item);
        } else {
          this.blocks[this.pos] = item;
        }
        this.current = type;
        return this;
      }

      combineBlock() {
        var current, prev;
        if (this.pos < 1) {
          return this;
        }
        prev = this.blocks[this.pos - 1].slice(0);
        current = this.blocks[this.pos].slice(0);
        prev[2] = current[2];
        this.blocks[this.pos - 1] = prev;
        this.current = prev[0];
        this.blocks = this.blocks.slice(0, -1);
        this.pos -= 1;
        return this;
      }

    };

    // begin php function wrappers
    ucfirst = function (str) {
      return (str.charAt(0)).toUpperCase() + str.substring(1);
    };

    preg_quote = function (str) {
      return str.replace(/[-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g, "\\$&");
    };

    str_replace = function (search, replace, str) {
      var i, j, l, len, len1, val;
      if (search instanceof Array) {
        if (replace instanceof Array) {
          for (i = j = 0, len = search.length; j < len; i = ++j) {
            val = search[i];
            str = str_replace(val, replace[i], str);
          }
        } else {
          for (l = 0, len1 = search.length; l < len1; l++) {
            val = search[l];
            str = str_replace(val, replace, str);
          }
        }
      } else {
        search = preg_quote(search);
        str = str.replace(new RegExp(search, 'g'), replace.replace(/\$/g, '$$$$'));
      }
      return str;
    };

    htmlspecialchars = function (str) {
      return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
    };

    trim = function (str, ch = null) {
      var c, i, j, ref, search;
      if (ch != null) {
        search = '';
        for (i = j = 0, ref = ch.length - 1; (0 <= ref ? j <= ref : j >= ref); i = 0 <= ref ? ++j : --j) {
          c = ch[i];
          c = preg_quote(c);
          search += c;
        }
        search = '[' + search + ']*';
        return str.replace(new RegExp('^' + search), '').replace(new RegExp(search + '$'), '');
      } else {
        return str.replace(/^\s*/, '').replace(/\s*$/, '');
      }
    };

    array_keys = function (arr) {
      var _, j, k, len, result;
      result = [];
      if (arr instanceof Array) {
        for (k = j = 0, len = arr.length; j < len; k = ++j) {
          _ = arr[k];
          result.push(k);
        }
      } else {
        for (k in arr) {
          result.push(k);
        }
      }
      return result;
    };

    array_values = function (arr) {
      var _, j, len, result, v;
      result = [];
      if (arr instanceof Array) {
        for (j = 0, len = arr.length; j < len; j++) {
          v = arr[j];
          result.push(v);
        }
      } else {
        for (_ in arr) {
          v = arr[_];
          result.push(v);
        }
      }
      return result;
    };

    return Parser;

  }).call(this);

  if (typeof module !== "undefined" && module !== null) {
    module.exports = Parser;
  } else if (typeof window !== "undefined" && window !== null) {
    window.HyperDown = Parser;
  }

}).call(this);
