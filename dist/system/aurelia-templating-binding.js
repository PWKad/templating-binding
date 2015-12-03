System.register(['aurelia-logging', 'aurelia-binding', 'aurelia-templating'], function (_export) {
  'use strict';

  var LogManager, bindingMode, connectable, Parser, ObserverLocator, EventManager, ListenerExpression, BindingExpression, CallExpression, NameExpression, BehaviorInstruction, BindingLanguage, InterpolationBindingExpression, InterpolationBinding, ChildInterpolationBinding, SyntaxInterpreter, info, TemplatingBindingLanguage;

  _export('configure', configure);

  function _inherits(subClass, superClass) { if (typeof superClass !== 'function' && superClass !== null) { throw new TypeError('Super expression must either be null or a function, not ' + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

  function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

  function validateTarget(target, propertyName) {
    if (propertyName === 'style') {
      LogManager.getLogger('templating-binding').info('Internet Explorer does not support interpolation in "style" attributes.  Use the style attribute\'s alias, "css" instead.');
    } else if (target.parentElement && target.parentElement.nodeName === 'TEXTAREA' && propertyName === 'textContent') {
      throw new Error('Interpolation binding cannot be used in the content of a textarea element.  Use <textarea value.bind="expression"></textarea> instead.');
    }
  }

  function configure(config) {
    config.container.registerSingleton(BindingLanguage, TemplatingBindingLanguage);
    config.container.registerAlias(BindingLanguage, TemplatingBindingLanguage);
  }

  return {
    setters: [function (_aureliaLogging) {
      LogManager = _aureliaLogging;
    }, function (_aureliaBinding) {
      bindingMode = _aureliaBinding.bindingMode;
      connectable = _aureliaBinding.connectable;
      Parser = _aureliaBinding.Parser;
      ObserverLocator = _aureliaBinding.ObserverLocator;
      EventManager = _aureliaBinding.EventManager;
      ListenerExpression = _aureliaBinding.ListenerExpression;
      BindingExpression = _aureliaBinding.BindingExpression;
      CallExpression = _aureliaBinding.CallExpression;
      NameExpression = _aureliaBinding.NameExpression;
    }, function (_aureliaTemplating) {
      BehaviorInstruction = _aureliaTemplating.BehaviorInstruction;
      BindingLanguage = _aureliaTemplating.BindingLanguage;
    }],
    execute: function () {
      InterpolationBindingExpression = (function () {
        function InterpolationBindingExpression(observerLocator, targetProperty, parts, mode, lookupFunctions, attribute) {
          _classCallCheck(this, InterpolationBindingExpression);

          this.observerLocator = observerLocator;
          this.targetProperty = targetProperty;
          this.parts = parts;
          this.mode = mode;
          this.lookupFunctions = lookupFunctions;
          this.attribute = this.attrToRemove = attribute;
          this.discrete = false;
        }

        InterpolationBindingExpression.prototype.createBinding = function createBinding(target) {
          if (this.parts.length === 3) {
            return new ChildInterpolationBinding(target, this.observerLocator, this.parts[1], this.mode, this.lookupFunctions, this.targetProperty, this.parts[0], this.parts[2]);
          }
          return new InterpolationBinding(this.observerLocator, this.parts, target, this.targetProperty, this.mode, this.lookupFunctions);
        };

        return InterpolationBindingExpression;
      })();

      _export('InterpolationBindingExpression', InterpolationBindingExpression);

      InterpolationBinding = (function () {
        function InterpolationBinding(observerLocator, parts, target, targetProperty, mode, lookupFunctions) {
          _classCallCheck(this, InterpolationBinding);

          validateTarget(target, targetProperty);
          this.observerLocator = observerLocator;
          this.parts = parts;
          this.targetProperty = observerLocator.getObserver(target, targetProperty);
          this.mode = mode;
          this.lookupFunctions = lookupFunctions;
        }

        InterpolationBinding.prototype.interpolate = function interpolate() {
          if (this.isBound) {
            var value = '';
            var parts = this.parts;
            for (var i = 0, ii = parts.length; i < ii; i++) {
              value += i % 2 === 0 ? parts[i] : this['childBinding' + i].value;
            }
            this.targetProperty.setValue(value);
          }
        };

        InterpolationBinding.prototype.bind = function bind(source) {
          if (this.isBound) {
            if (this.source === source) {
              return;
            }
            this.unbind();
          }
          this.source = source;

          var parts = this.parts;
          for (var i = 1, ii = parts.length; i < ii; i += 2) {
            var binding = new ChildInterpolationBinding(this, this.observerLocator, parts[i], this.mode, this.lookupFunctions);
            binding.bind(source);
            this['childBinding' + i] = binding;
          }

          this.isBound = true;
          this.interpolate();
        };

        InterpolationBinding.prototype.unbind = function unbind() {
          if (!this.isBound) {
            return;
          }
          this.isBound = false;
          this.source = null;
          var parts = this.parts;
          for (var i = 1, ii = parts.length; i < ii; i += 2) {
            var _name = 'childBinding' + i;
            this[_name].unbind();
          }
        };

        return InterpolationBinding;
      })();

      _export('InterpolationBinding', InterpolationBinding);

      ChildInterpolationBinding = (function () {
        function ChildInterpolationBinding(target, observerLocator, sourceExpression, mode, lookupFunctions, targetProperty, left, right) {
          _classCallCheck(this, _ChildInterpolationBinding);

          if (target instanceof InterpolationBinding) {
            this.parent = target;
          } else {
            validateTarget(target, targetProperty);
            this.targetProperty = observerLocator.getObserver(target, targetProperty);
          }
          this.observerLocator = observerLocator;
          this.sourceExpression = sourceExpression;
          this.mode = mode;
          this.lookupFunctions = lookupFunctions;
          this.left = left;
          this.right = right;
        }

        ChildInterpolationBinding.prototype.updateTarget = function updateTarget(value) {
          value = value === null || value === undefined ? '' : value.toString();
          if (value !== this.value) {
            this.value = value;
            if (this.parent) {
              this.parent.interpolate();
            } else {
              this.targetProperty.setValue(this.left + value + this.right);
            }
          }
        };

        ChildInterpolationBinding.prototype.call = function call() {
          if (!this.isBound) {
            return;
          }

          var value = this.sourceExpression.evaluate(this.source, this.lookupFunctions);
          this.updateTarget(value);

          if (this.mode !== bindingMode.oneTime) {
            this._version++;
            this.sourceExpression.connect(this, this.source);
            if (value instanceof Array) {
              this.observeArray(value);
            }
            this.unobserve(false);
          }
        };

        ChildInterpolationBinding.prototype.bind = function bind(source) {
          if (this.isBound) {
            if (this.source === source) {
              return;
            }
            this.unbind();
          }
          this.isBound = true;
          this.source = source;

          var sourceExpression = this.sourceExpression;
          if (sourceExpression.bind) {
            sourceExpression.bind(this, source, this.lookupFunctions);
          }

          var value = sourceExpression.evaluate(source, this.lookupFunctions);
          this.updateTarget(value);

          if (this.mode === bindingMode.oneWay) {
            sourceExpression.connect(this, source);
            if (value instanceof Array) {
              this.observeArray(value);
            }
          }
        };

        ChildInterpolationBinding.prototype.unbind = function unbind() {
          if (!this.isBound) {
            return;
          }
          this.isBound = false;
          var sourceExpression = this.sourceExpression;
          if (sourceExpression.unbind) {
            sourceExpression.unbind(this, this.source);
          }
          this.source = null;
          this.unobserve(true);
        };

        var _ChildInterpolationBinding = ChildInterpolationBinding;
        ChildInterpolationBinding = connectable()(ChildInterpolationBinding) || ChildInterpolationBinding;
        return ChildInterpolationBinding;
      })();

      _export('ChildInterpolationBinding', ChildInterpolationBinding);

      SyntaxInterpreter = (function () {
        SyntaxInterpreter.inject = function inject() {
          return [Parser, ObserverLocator, EventManager];
        };

        function SyntaxInterpreter(parser, observerLocator, eventManager) {
          _classCallCheck(this, SyntaxInterpreter);

          this.parser = parser;
          this.observerLocator = observerLocator;
          this.eventManager = eventManager;
        }

        SyntaxInterpreter.prototype.interpret = function interpret(resources, element, info, existingInstruction, context) {
          if (info.command in this) {
            return this[info.command](resources, element, info, existingInstruction, context);
          }

          return this.handleUnknownCommand(resources, element, info, existingInstruction, context);
        };

        SyntaxInterpreter.prototype.handleUnknownCommand = function handleUnknownCommand(resources, element, info, existingInstruction, context) {
          LogManager.getLogger('templating-binding').warn('Unknown binding command.', info);
          return existingInstruction;
        };

        SyntaxInterpreter.prototype.determineDefaultBindingMode = function determineDefaultBindingMode(element, attrName, context) {
          var tagName = element.tagName.toLowerCase();

          if (tagName === 'input') {
            return attrName === 'value' || attrName === 'checked' || attrName === 'files' ? bindingMode.twoWay : bindingMode.oneWay;
          } else if (tagName === 'textarea' || tagName === 'select') {
            return attrName === 'value' ? bindingMode.twoWay : bindingMode.oneWay;
          } else if (attrName === 'textcontent' || attrName === 'innerhtml') {
            return element.contentEditable === 'true' ? bindingMode.twoWay : bindingMode.oneWay;
          } else if (attrName === 'scrolltop' || attrName === 'scrollleft') {
            return bindingMode.twoWay;
          }

          if (context && attrName in context.attributes) {
            return context.attributes[attrName].defaultBindingMode || bindingMode.oneWay;
          }

          return bindingMode.oneWay;
        };

        SyntaxInterpreter.prototype.bind = function bind(resources, element, info, existingInstruction, context) {
          var instruction = existingInstruction || BehaviorInstruction.attribute(info.attrName);

          instruction.attributes[info.attrName] = new BindingExpression(this.observerLocator, this.attributeMap[info.attrName] || info.attrName, this.parser.parse(info.attrValue), info.defaultBindingMode || this.determineDefaultBindingMode(element, info.attrName, context), resources.lookupFunctions);

          return instruction;
        };

        SyntaxInterpreter.prototype.trigger = function trigger(resources, element, info) {
          return new ListenerExpression(this.eventManager, info.attrName, this.parser.parse(info.attrValue), false, true, resources.lookupFunctions);
        };

        SyntaxInterpreter.prototype.delegate = function delegate(resources, element, info) {
          return new ListenerExpression(this.eventManager, info.attrName, this.parser.parse(info.attrValue), true, true, resources.lookupFunctions);
        };

        SyntaxInterpreter.prototype.call = function call(resources, element, info, existingInstruction) {
          var instruction = existingInstruction || BehaviorInstruction.attribute(info.attrName);

          instruction.attributes[info.attrName] = new CallExpression(this.observerLocator, info.attrName, this.parser.parse(info.attrValue), resources.lookupFunctions);

          return instruction;
        };

        SyntaxInterpreter.prototype.options = function options(resources, element, info, existingInstruction, context) {
          var instruction = existingInstruction || BehaviorInstruction.attribute(info.attrName);
          var attrValue = info.attrValue;
          var language = this.language;
          var name = null;
          var target = '';
          var current = undefined;
          var i = undefined;
          var ii = undefined;

          for (i = 0, ii = attrValue.length; i < ii; ++i) {
            current = attrValue[i];

            if (current === ';') {
              info = language.inspectAttribute(resources, name, target.trim());
              language.createAttributeInstruction(resources, element, info, instruction, context);

              if (!instruction.attributes[info.attrName]) {
                instruction.attributes[info.attrName] = info.attrValue;
              }

              target = '';
              name = null;
            } else if (current === ':' && name === null) {
              name = target.trim();
              target = '';
            } else {
              target += current;
            }
          }

          if (name !== null) {
            info = language.inspectAttribute(resources, name, target.trim());
            language.createAttributeInstruction(resources, element, info, instruction, context);

            if (!instruction.attributes[info.attrName]) {
              instruction.attributes[info.attrName] = info.attrValue;
            }
          }

          return instruction;
        };

        SyntaxInterpreter.prototype['for'] = function _for(resources, element, info, existingInstruction) {
          var parts = undefined;
          var keyValue = undefined;
          var instruction = undefined;
          var attrValue = undefined;
          var isDestructuring = undefined;

          attrValue = info.attrValue;
          isDestructuring = attrValue.match(/^ *[[].+[\]]/);
          parts = isDestructuring ? attrValue.split('of ') : attrValue.split(' of ');

          if (parts.length !== 2) {
            throw new Error('Incorrect syntax for "for". The form is: "$local of $items" or "[$key, $value] of $items".');
          }

          instruction = existingInstruction || BehaviorInstruction.attribute(info.attrName);

          if (isDestructuring) {
            keyValue = parts[0].replace(/[[\]]/g, '').replace(/,/g, ' ').replace(/\s+/g, ' ').trim().split(' ');
            instruction.attributes.key = keyValue[0];
            instruction.attributes.value = keyValue[1];
          } else {
            instruction.attributes.local = parts[0];
          }

          instruction.attributes.items = new BindingExpression(this.observerLocator, 'items', this.parser.parse(parts[1]), bindingMode.oneWay, resources.lookupFunctions);

          return instruction;
        };

        SyntaxInterpreter.prototype['two-way'] = function twoWay(resources, element, info, existingInstruction) {
          var instruction = existingInstruction || BehaviorInstruction.attribute(info.attrName);

          instruction.attributes[info.attrName] = new BindingExpression(this.observerLocator, this.attributeMap[info.attrName] || info.attrName, this.parser.parse(info.attrValue), bindingMode.twoWay, resources.lookupFunctions);

          return instruction;
        };

        SyntaxInterpreter.prototype['one-way'] = function oneWay(resources, element, info, existingInstruction) {
          var instruction = existingInstruction || BehaviorInstruction.attribute(info.attrName);

          instruction.attributes[info.attrName] = new BindingExpression(this.observerLocator, this.attributeMap[info.attrName] || info.attrName, this.parser.parse(info.attrValue), bindingMode.oneWay, resources.lookupFunctions);

          return instruction;
        };

        SyntaxInterpreter.prototype['one-time'] = function oneTime(resources, element, info, existingInstruction) {
          var instruction = existingInstruction || BehaviorInstruction.attribute(info.attrName);

          instruction.attributes[info.attrName] = new BindingExpression(this.observerLocator, this.attributeMap[info.attrName] || info.attrName, this.parser.parse(info.attrValue), bindingMode.oneTime, resources.lookupFunctions);

          return instruction;
        };

        return SyntaxInterpreter;
      })();

      _export('SyntaxInterpreter', SyntaxInterpreter);

      info = {};

      TemplatingBindingLanguage = (function (_BindingLanguage) {
        _inherits(TemplatingBindingLanguage, _BindingLanguage);

        TemplatingBindingLanguage.inject = function inject() {
          return [Parser, ObserverLocator, SyntaxInterpreter];
        };

        function TemplatingBindingLanguage(parser, observerLocator, syntaxInterpreter) {
          _classCallCheck(this, TemplatingBindingLanguage);

          _BindingLanguage.call(this);
          this.parser = parser;
          this.observerLocator = observerLocator;
          this.syntaxInterpreter = syntaxInterpreter;
          this.emptyStringExpression = this.parser.parse('\'\'');
          syntaxInterpreter.language = this;
          this.attributeMap = syntaxInterpreter.attributeMap = {
            'contenteditable': 'contentEditable',
            'for': 'htmlFor',
            'tabindex': 'tabIndex',
            'textcontent': 'textContent',
            'innerhtml': 'innerHTML',

            'maxlength': 'maxLength',
            'minlength': 'minLength',
            'formaction': 'formAction',
            'formenctype': 'formEncType',
            'formmethod': 'formMethod',
            'formnovalidate': 'formNoValidate',
            'formtarget': 'formTarget',
            'rowspan': 'rowSpan',
            'colspan': 'colSpan',
            'scrolltop': 'scrollTop',
            'scrollleft': 'scrollLeft',
            'readonly': 'readOnly'
          };
        }

        TemplatingBindingLanguage.prototype.inspectAttribute = function inspectAttribute(resources, attrName, attrValue) {
          var parts = attrName.split('.');

          info.defaultBindingMode = null;

          if (parts.length === 2) {
            info.attrName = parts[0].trim();
            info.attrValue = attrValue;
            info.command = parts[1].trim();

            if (info.command === 'ref') {
              info.expression = new NameExpression(attrValue, info.attrName);
              info.command = null;
              info.attrName = 'ref';
            } else {
              info.expression = null;
            }
          } else if (attrName === 'ref') {
            info.attrName = attrName;
            info.attrValue = attrValue;
            info.command = null;
            info.expression = new NameExpression(attrValue, 'element');
          } else {
            info.attrName = attrName;
            info.attrValue = attrValue;
            info.command = null;
            info.expression = this.parseContent(resources, attrName, attrValue);
          }

          return info;
        };

        TemplatingBindingLanguage.prototype.createAttributeInstruction = function createAttributeInstruction(resources, element, theInfo, existingInstruction, context) {
          var instruction = undefined;

          if (theInfo.expression) {
            if (theInfo.attrName === 'ref') {
              return theInfo.expression;
            }

            instruction = existingInstruction || BehaviorInstruction.attribute(theInfo.attrName);
            instruction.attributes[theInfo.attrName] = theInfo.expression;
          } else if (theInfo.command) {
            instruction = this.syntaxInterpreter.interpret(resources, element, theInfo, existingInstruction, context);
          }

          return instruction;
        };

        TemplatingBindingLanguage.prototype.parseText = function parseText(resources, value) {
          return this.parseContent(resources, 'textContent', value);
        };

        TemplatingBindingLanguage.prototype.parseContent = function parseContent(resources, attrName, attrValue) {
          var i = attrValue.indexOf('${', 0);
          var ii = attrValue.length;
          var char = undefined;
          var pos = 0;
          var open = 0;
          var quote = null;
          var interpolationStart = undefined;
          var parts = undefined;
          var partIndex = 0;

          while (i >= 0 && i < ii - 2) {
            open = 1;
            interpolationStart = i;
            i += 2;

            do {
              char = attrValue[i];
              i++;

              if (char === "'" || char === '"') {
                if (quote === null) {
                  quote = char;
                } else if (quote === char) {
                  quote = null;
                }
                continue;
              }

              if (char === '\\') {
                i++;
                continue;
              }

              if (quote !== null) {
                continue;
              }

              if (char === '{') {
                open++;
              } else if (char === '}') {
                open--;
              }
            } while (open > 0 && i < ii);

            if (open === 0) {
              parts = parts || [];
              if (attrValue[interpolationStart - 1] === '\\' && attrValue[interpolationStart - 2] !== '\\') {
                parts[partIndex] = attrValue.substring(pos, interpolationStart - 1) + attrValue.substring(interpolationStart, i);
                partIndex++;
                parts[partIndex] = this.emptyStringExpression;
                partIndex++;
              } else {
                parts[partIndex] = attrValue.substring(pos, interpolationStart);
                partIndex++;
                parts[partIndex] = this.parser.parse(attrValue.substring(interpolationStart + 2, i - 1));
                partIndex++;
              }
              pos = i;
              i = attrValue.indexOf('${', i);
            } else {
              break;
            }
          }

          if (partIndex === 0) {
            return null;
          }

          parts[partIndex] = attrValue.substr(pos);

          return new InterpolationBindingExpression(this.observerLocator, this.attributeMap[attrName] || attrName, parts, bindingMode.oneWay, resources.lookupFunctions, attrName);
        };

        return TemplatingBindingLanguage;
      })(BindingLanguage);

      _export('TemplatingBindingLanguage', TemplatingBindingLanguage);
    }
  };
});