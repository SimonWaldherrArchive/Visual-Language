(function() {
  var Builtin, BuiltinApplication, BuiltinSyntaxError, Connection, Exit, FunctionApplication, Input, InputError, Literal, LiteralValue, Nib, Node, NotConnected, NotImplemented, Output, RuntimeException, SubRoutine, SubroutineApplication, UnknownNode, all_builtins, all_subroutines, animate, animations_counter, boxes, camera, connecting_object, connection_view, current_scope, dissociate_exception, dragging_object, dragging_offset, editor_size, eval_expression, execute, get_absolute_nib_position, get_nib_position, half_editor_size, highlight, highlighted_node_material, highlighted_objects, ignore_if_disconnected, last, load_implementation, load_state, make_arrow, make_box, make_connection, make_main, make_nib_view, make_node_view, make_subroutine_view, make_text, mouse_coords, nib_geometry, nib_mesh, node_geometry, node_material, node_mesh, node_registry, obj_first, playground_id, pretty_json, projector, ray_cast_mouse, renderer, scene, schema_version, should_animate, subroutine_geometry, subroutine_material, subroutine_mesh, system_arrow, unhighlight, unhighlight_all, update, valid_json, whitespace_split,
    __hasProp = Object.prototype.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor; child.__super__ = parent.prototype; return child; };

  editor_size = V(600, 700);

  half_editor_size = editor_size.scale(0.5);

  camera = new THREE.OrthographicCamera(0, editor_size.x, editor_size.y, 0, -2000, 1000);

  scene = new THREE.Scene();

  scene.add(camera);

  renderer = new THREE.CanvasRenderer();

  renderer.setSize(editor_size.x, editor_size.y);

  projector = new THREE.Projector();

  last = function(list) {
    return list[list.length - 1];
  };

  obj_first = function(obj) {
    var item, key;
    for (key in obj) {
      item = obj[key];
      return item;
    }
  };

  schema_version = 1;

  boxes = {};

  node_registry = {};

  all_subroutines = {};

  all_builtins = {};

  current_scope = null;

  system_arrow = null;

  should_animate = false;

  update = function() {
    return renderer.render(scene, camera);
  };

  animations_counter = 0;

  animate = function(field) {
    requestAnimationFrame((function() {
      return animate(field);
    }), field);
    animations_counter += 1;
    return update();
  };

  eval_expression = function(expression) {
    return eval("(" + expression + ")");
  };

  setInterval(function() {
    return animations_counter = 0;
  }, 1000);

  /* MODELS
  */

  RuntimeException = (function() {

    function RuntimeException(message) {
      this.message = message;
    }

    return RuntimeException;

  })();

  Exit = (function(_super) {

    __extends(Exit, _super);

    function Exit() {
      this.message = "Exit Signal";
    }

    return Exit;

  })(RuntimeException);

  InputError = (function(_super) {

    __extends(InputError, _super);

    function InputError() {
      this.message = "Cancelled execution due to lack of input";
    }

    return InputError;

  })(RuntimeException);

  NotConnected = (function(_super) {

    __extends(NotConnected, _super);

    function NotConnected() {
      this.message = "Something in the program is disconnected";
    }

    return NotConnected;

  })(RuntimeException);

  NotImplemented = (function(_super) {

    __extends(NotImplemented, _super);

    function NotImplemented(name) {
      this.name = name;
      this.message = "Builtin \"" + this.name + "\" is not implemented";
    }

    return NotImplemented;

  })(RuntimeException);

  BuiltinSyntaxError = (function(_super) {

    __extends(BuiltinSyntaxError, _super);

    function BuiltinSyntaxError(name, exception) {
      this.name = name;
      this.exception = exception;
      this.message = "" + exception + " in builtin \"" + this.name + "\": ";
    }

    return BuiltinSyntaxError;

  })(RuntimeException);

  Builtin = (function() {

    function Builtin(_arg) {
      this.name = _arg.name, this.output_implementation = _arg.output_implementation, this.memo_implementation = _arg.memo_implementation, this.inputs = _arg.inputs, this.outputs = _arg.outputs, this.id = _arg.id;
      if (this.memo_implementation == null) this.memo_implementation = null;
      if (this.inputs == null) this.inputs = [];
      if (this.outputs == null) this.outputs = ['OUT'];
      if (this.id == null) this.id = UUID();
      all_builtins[this.id] = this;
    }

    Builtin.prototype.type = 'builtin';

    Builtin.prototype.toJSON = function() {
      return {
        id: this.id,
        name: this.name,
        inputs: this.inputs,
        outputs: this.outputs,
        memo_implementation: this.memo_implementation,
        output_implementation: this.output_implementation
      };
    };

    Builtin.prototype["export"] = function() {
      var builtins;
      builtins = {};
      builtins[this.id] = this;
      return {
        subroutines: {},
        builtins: builtins,
        schema_version: schema_version
      };
    };

    return Builtin;

  })();

  SubRoutine = (function() {

    function SubRoutine(name, inputs, outputs, id) {
      var index, text;
      this.name = name != null ? name : '';
      if (inputs == null) inputs = [];
      if (outputs == null) outputs = [];
      this.id = id != null ? id : UUID();
      node_registry[this.id] = this;
      this.view = make_subroutine_view(this);
      if (!outputs.length) outputs = ['OUT'];
      this.inputs = (function() {
        var _len, _results;
        _results = [];
        for (index = 0, _len = inputs.length; index < _len; index++) {
          text = inputs[index];
          _results.push(new Output(this, text, index, inputs.length - 1));
        }
        return _results;
      }).call(this);
      this.outputs = (function() {
        var _len, _results;
        _results = [];
        for (index = 0, _len = outputs.length; index < _len; index++) {
          text = outputs[index];
          _results.push(new Input(this, text, index, outputs.length - 1));
        }
        return _results;
      }).call(this);
      this.nodes = {};
      this.connections = {};
      all_subroutines[this.id] = this;
    }

    SubRoutine.prototype.type = 'subroutine';

    SubRoutine.prototype.toJSON = function() {
      return {
        id: this.id,
        name: this.name,
        nodes: _.values(this.nodes),
        connections: _.values(this.connections),
        inputs: this.get_inputs(),
        outputs: this.get_outputs()
      };
    };

    SubRoutine.prototype.invoke = function(index, inputs) {
      var output, the_scope, _ref;
      the_scope = {
        subroutine: this,
        inputs: inputs,
        memos: {}
      };
      output = (_ref = this.outputs[index].get_connection()) != null ? _ref.connection.output : void 0;
      if (!output) throw new NotConnected;
      if (output.parent instanceof SubRoutine) {
        return inputs[output.index]();
      } else if (output.parent instanceof Node) {
        return output.parent.evaluation(the_scope, output.index);
      }
    };

    SubRoutine.prototype.get_inputs = function() {
      var input, _i, _len, _ref, _results;
      _ref = this.inputs;
      _results = [];
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        input = _ref[_i];
        _results.push(input.text);
      }
      return _results;
    };

    SubRoutine.prototype.get_outputs = function() {
      var output, _i, _len, _ref, _results;
      _ref = this.outputs;
      _results = [];
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        output = _ref[_i];
        _results.push(output.text);
      }
      return _results;
    };

    SubRoutine.prototype.run = function(output_index, input_values) {
      var _this = this;
      return execute(function() {
        return _this.invoke(output_index, input_values);
      });
    };

    SubRoutine.prototype["export"] = function() {
      var dependencies;
      dependencies = this.get_dependencies();
      dependencies.schema_version = schema_version;
      return dependencies;
    };

    SubRoutine.prototype.get_dependencies = function(dependencies) {
      var child_dependencies, id, node, _ref;
      if (dependencies == null) {
        dependencies = {
          subroutines: {},
          builtins: {}
        };
      }
      if (!(this.id in dependencies.subroutines)) {
        dependencies.subroutines[this.id] = this;
      }
      _ref = this.nodes;
      for (id in _ref) {
        node = _ref[id];
        if (node instanceof SubroutineApplication) {
          child_dependencies = node.implementation.get_dependencies(dependencies);
          _.extend(dependencies.subroutines, child_dependencies.subroutines);
          _.extend(dependencies.builtins, child_dependencies.builtins);
        } else if (node instanceof BuiltinApplication) {
          dependencies.builtins[this.id] = node.implementation;
        }
      }
      return dependencies;
    };

    SubRoutine.prototype.subroutines_referenced = function() {
      var output, parent, results, resuts, _i, _len, _ref, _ref2;
      results = [];
      _ref = this.outputs;
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        output = _ref[_i];
        parent = (_ref2 = output.get_connection()) != null ? _ref2.connection.output.parent : void 0;
        if (parent) {
          if (parent.type === 'function') results.push(parent.id);
          resuts = results.concat(parent.subroutines_referenced());
        }
      }
      return results;
    };

    SubRoutine.prototype.build_adjacency_list = function() {
      var adjacency_list, id, input, input_index, input_queue, item, item_count, node, _i, _len, _len2, _ref, _ref2;
      input_queue = [].concat(this.outputs);
      _ref = this.nodes;
      for (id in _ref) {
        node = _ref[id];
        node.adjacency_id = null;
      }
      adjacency_list = [];
      while (input_queue.length > 0) {
        input = input_queue.pop();
        node = input.get_node();
        if (node instanceof Node && node.adjacency_id === null) {
          item_count = adjacency_list.push({
            node: node,
            connections: []
          });
          node.adjacency_id = item_count - 1;
          input_queue = input_queue.concat(node.inputs);
        }
      }
      for (_i = 0, _len = adjacency_list.length; _i < _len; _i++) {
        item = adjacency_list[_i];
        _ref2 = item.node.inputs;
        for (input_index = 0, _len2 = _ref2.length; input_index < _len2; input_index++) {
          input = _ref2[input_index];
          node = input.get_node();
          if (node instanceof Node) {
            item.connections[input_index] = node.adjacency_id;
          }
        }
      }
      return adjacency_list;
    };

    SubRoutine.prototype.remove_node = function(node) {
      this.view.remove(node.view);
      return delete this.nodes[node.id];
    };

    SubRoutine.prototype.add_node = function(node) {
      this.view.add(node.view);
      return this.nodes[node.id] = node;
    };

    SubRoutine.prototype.remove_connection = function(connection) {
      this.view.remove(connection.view);
      return delete this.connections[connection.id];
    };

    SubRoutine.prototype.add_connection = function(connection) {
      this.view.add(connection.view);
      return this.connections[connection.id] = connection;
    };

    return SubRoutine;

  })();

  Node = (function() {

    function Node() {
      node_registry[this.id] = this;
      this.scope = current_scope;
      this.scope.nodes[this.id] = this;
      this.view = make_node_view(this);
    }

    Node.prototype.set_position = function(position) {
      this.position = position;
      return this.view.position.copy(this.position);
    };

    Node.prototype.get_nibs = function() {
      return this.inputs.concat(this.outputs);
    };

    Node.prototype["delete"] = function() {
      var nib, _i, _len, _ref, _results;
      this.scope.view.remove(this.view);
      delete this.scope.nodes[this.id];
      _ref = this.get_nibs();
      _results = [];
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        nib = _ref[_i];
        _results.push(nib.delete_connections());
      }
      return _results;
    };

    Node.prototype.toJSON = function() {
      return {
        position: this.position,
        text: this.text,
        id: this.id,
        type: this.type
      };
    };

    return Node;

  })();

  FunctionApplication = (function(_super) {

    __extends(FunctionApplication, _super);

    function FunctionApplication(_arg) {
      var index, inputs, name, outputs, text;
      name = _arg.name, inputs = _arg.inputs, outputs = _arg.outputs;
      this.text = name;
      FunctionApplication.__super__.constructor.call(this);
      this.inputs = (function() {
        var _len, _results;
        _results = [];
        for (index = 0, _len = inputs.length; index < _len; index++) {
          text = inputs[index];
          _results.push(new Input(this, text, index, inputs.length - 1));
        }
        return _results;
      }).call(this);
      this.outputs = (function() {
        var _len, _results;
        _results = [];
        for (index = 0, _len = outputs.length; index < _len; index++) {
          text = outputs[index];
          _results.push(new Output(this, text, index, outputs.length - 1));
        }
        return _results;
      }).call(this);
    }

    FunctionApplication.prototype.evaluation = function(the_scope, output_index) {};

    FunctionApplication.prototype.toJSON = function() {
      var json;
      json = FunctionApplication.__super__.toJSON.call(this);
      json.implementation_id = this.implementation.id;
      return json;
    };

    FunctionApplication.prototype.virtual_inputs = function(the_scope) {
      var input, input_values, _fn, _i, _len, _ref;
      input_values = [];
      _ref = this.inputs;
      _fn = function(input) {
        return input_values.push(_.memoize(function() {
          var output, _ref2;
          output = (_ref2 = input.get_connection()) != null ? _ref2.connection.output : void 0;
          if (!output) throw new NotConnected;
          if (output.parent instanceof SubRoutine) {
            return the_scope.inputs[output.index]();
          } else if (output.parent instanceof Node) {
            return output.parent.evaluation(the_scope, output.index);
          }
        }));
      };
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        input = _ref[_i];
        _fn(input);
      }
      return input_values;
    };

    return FunctionApplication;

  })(Node);

  UnknownNode = (function(_super) {

    __extends(UnknownNode, _super);

    function UnknownNode(position, type, text, id) {
      this.position = position;
      this.id = id;
      this.type = 'unknown';
      this.text = "Unknown " + type + ": " + text;
      this.inputs = [];
      this.outputs = [];
      UnknownNode.__super__.constructor.call(this);
    }

    return UnknownNode;

  })(Node);

  SubroutineApplication = (function(_super) {

    __extends(SubroutineApplication, _super);

    function SubroutineApplication(position, implementation, id) {
      this.position = position;
      this.implementation = implementation;
      this.id = id != null ? id : UUID();
      this.type = 'function';
      SubroutineApplication.__super__.constructor.call(this, {
        name: this.implementation.name,
        inputs: this.implementation.get_inputs(),
        outputs: this.implementation.get_outputs()
      });
    }

    SubroutineApplication.prototype.evaluation = function(the_scope, output_index) {
      var input_values;
      input_values = this.virtual_inputs(the_scope);
      return this.implementation.invoke(output_index, input_values);
    };

    SubroutineApplication.prototype.subroutines_referenced = function() {
      var input, parent, results, resuts, _i, _len, _ref, _ref2;
      results = [];
      _ref = this.inputs;
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        input = _ref[_i];
        parent = (_ref2 = input.get_connection()) != null ? _ref2.connection.output.parent : void 0;
        if (parent) {
          if (parent.type === 'function') results.push(parent.id);
          resuts = results.concat(parent.subroutines_referenced());
        }
      }
      return results;
    };

    return SubroutineApplication;

  })(FunctionApplication);

  BuiltinApplication = (function(_super) {

    __extends(BuiltinApplication, _super);

    function BuiltinApplication(position, implementation, id) {
      this.position = position;
      this.implementation = implementation;
      this.id = id != null ? id : UUID();
      this.type = 'builtin';
      BuiltinApplication.__super__.constructor.call(this, this.implementation);
    }

    BuiltinApplication.prototype.evaluation = function(the_scope, output_index) {
      var args, input_values, memo_function, output_function;
      input_values = this.virtual_inputs(the_scope);
      try {
        memo_function = eval_expression(this.implementation.memo_implementation);
        output_function = eval_expression(this.implementation.output_implementation);
      } catch (exception) {
        if (exception instanceof SyntaxError) {
          throw new BuiltinSyntaxError(this.text, exception);
        } else {
          throw exception;
        }
      }
      if (!output_function) throw new NotImplemented(this.text);
      args = input_values.concat([output_index]);
      if (memo_function && !(this.id in the_scope.memos)) {
        the_scope.memos[this.id] = memo_function.apply(null, args);
      }
      return output_function.apply(null, args.concat([the_scope.memos[this.id]]));
    };

    return BuiltinApplication;

  })(FunctionApplication);

  LiteralValue = (function() {

    function LiteralValue(text) {
      this.text = text;
    }

    LiteralValue.prototype.evaluation = function() {
      return eval_expression(this.text);
    };

    LiteralValue.prototype.type = 'literal';

    return LiteralValue;

  })();

  Literal = (function(_super) {

    __extends(Literal, _super);

    function Literal(position, value, id) {
      this.position = position;
      this.id = id != null ? id : UUID();
      this.type = 'literal';
      if (value instanceof SubRoutine) {
        this.implementation = value;
        this.text = value.name;
      } else {
        this.implementation = new LiteralValue(value);
        this.text = value;
      }
      Literal.__super__.constructor.call(this);
      this.inputs = [];
      this.outputs = [new Output(this, 'OUT')];
    }

    Literal.prototype.evaluation = function() {
      return this.implementation.evaluation();
    };

    Literal.prototype.toJSON = function() {
      var json;
      json = Literal.__super__.toJSON.call(this);
      if (this.implementation instanceof SubRoutine) {
        json.implementation_id = this.implementation.id;
      }
      return json;
    };

    Literal.prototype.subroutines_referenced = function() {
      return [];
    };

    return Literal;

  })(Node);

  Nib = (function() {

    function Nib() {
      this.view = make_nib_view(this, this.parent instanceof Node);
      this.connections = {};
    }

    Nib.prototype.delete_connections = function() {
      var connection, id, _ref, _results;
      _ref = this.connections;
      _results = [];
      for (id in _ref) {
        connection = _ref[id];
        _results.push(connection.connection["delete"]());
      }
      return _results;
    };

    return Nib;

  })();

  Input = (function(_super) {

    __extends(Input, _super);

    function Input(parent, text, index, siblings) {
      this.parent = parent;
      this.text = text;
      this.index = index != null ? index : 0;
      this.siblings = siblings != null ? siblings : 0;
      Input.__super__.constructor.call(this);
    }

    Input.prototype._add_connection = function(connection, vertex) {
      var _ref;
      if ((_ref = this.get_connection()) != null) _ref.connection["delete"]();
      this.connections = {};
      return this.connections[connection.id] = {
        connection: connection,
        vertex: vertex
      };
    };

    Input.prototype.get_connection = function() {
      var connection, id, _ref;
      _ref = this.connections;
      for (id in _ref) {
        connection = _ref[id];
        return connection;
      }
    };

    Input.prototype.get_node = function() {
      var _ref;
      return (_ref = this.get_connection()) != null ? _ref.connection.output.parent : void 0;
    };

    Input.prototype.connect = function(output) {
      return new Connection(this, output);
    };

    return Input;

  })(Nib);

  Output = (function(_super) {

    __extends(Output, _super);

    function Output(parent, text, index, siblings) {
      this.parent = parent;
      this.text = text;
      this.index = index != null ? index : 0;
      this.siblings = siblings != null ? siblings : 0;
      Output.__super__.constructor.call(this);
    }

    Output.prototype._add_connection = function(connection, vertex) {
      return this.connections[connection.id] = {
        connection: connection,
        vertex: vertex
      };
    };

    Output.prototype.connect = function(input) {
      return new Connection(input, this);
    };

    return Output;

  })(Nib);

  Connection = (function() {

    function Connection(input, output, id) {
      var input_vertex, output_vertex, _ref;
      this.input = input;
      this.output = output;
      this.id = id != null ? id : UUID();
      _ref = connection_view(this), this.view = _ref[0], input_vertex = _ref[1], output_vertex = _ref[2];
      this.input._add_connection(this, input_vertex);
      this.output._add_connection(this, output_vertex);
      this.scope = current_scope;
      this.scope.connections[this.id] = this;
    }

    Connection.prototype.toJSON = function() {
      return {
        input: {
          index: this.input.index,
          parent_id: this.input.parent.id
        },
        output: {
          index: this.output.index,
          parent_id: this.output.parent.id
        }
      };
    };

    Connection.prototype["delete"] = function() {
      this.scope.view.remove(this.view);
      delete this.scope.connections[this.id];
      delete this.output.connections[this.id];
      return this.input.connections = {};
    };

    return Connection;

  })();

  /* VIEWS
  */

  make_subroutine_view = function(subroutine) {
    var box, box_size, position;
    box_size = editor_size;
    position = box_size.scale(1 / 2.0);
    box = make_box(null, subroutine_mesh, 10, position);
    box.model = subroutine;
    boxes[box.id] = box;
    return box;
  };

  make_node_view = function(node) {
    var main_box;
    main_box = make_box(node.text, node_mesh, 10, node.position);
    main_box.model = node;
    node.scope.view.add(main_box);
    boxes[main_box.id] = main_box;
    return main_box;
  };

  make_nib_view = function(nib, is_node) {
    var parent, parent_size, sub_box, x_position, y_offset, y_position;
    parent_size = is_node ? V(60, 60) : editor_size.minus(V(10, 10));
    y_offset = parent_size.y / 2.0;
    x_position = -parent_size.x / 2.0 + parent_size.x * nib.index / nib.siblings;
    y_position = y_offset * (nib instanceof Input ? 1 : -1) * (is_node ? 1 : -1);
    sub_box = make_box(nib.text, nib_mesh, 5, V(x_position, y_position));
    sub_box.model = nib;
    parent = nib.parent.view;
    parent.add(sub_box);
    return sub_box;
  };

  connection_view = function(connection) {
    var arrow, point1, point2;
    point1 = get_nib_position(connection.input);
    point2 = get_nib_position(connection.output);
    arrow = make_arrow(point1, point2);
    return [arrow, arrow.geometry.vertices[0], arrow.geometry.vertices[1]];
  };

  /* FACTORIES
  */

  make_connection = function(source, target) {
    var input, output;
    if (source.model instanceof Input) {
      input = source.model;
      output = target.model;
    } else {
      input = target.model;
      output = source.model;
    }
    return new Connection(input, output);
  };

  /* CORE RENDERING
  */

  make_text = function(text, size) {
    var centerOffset, geometry, material, mesh;
    geometry = new THREE.TextGeometry(text, {
      size: size,
      font: 'helvetiker',
      curveSegments: 2
    });
    geometry.computeBoundingBox();
    centerOffset = -0.5 * (geometry.boundingBox.max.x - geometry.boundingBox.min.x);
    material = new THREE.MeshBasicMaterial({
      color: 0x000000,
      overdraw: true
    });
    mesh = new THREE.Mesh(geometry, material);
    mesh.position.x = centerOffset;
    return mesh;
  };

  node_material = new THREE.MeshBasicMaterial({
    color: 0x888888
  });

  highlighted_node_material = new THREE.MeshBasicMaterial({
    color: 0x8888FF
  });

  subroutine_material = new THREE.MeshBasicMaterial({
    color: 0xEEEEEE
  });

  node_geometry = new THREE.PlaneGeometry(50, 50);

  nib_geometry = new THREE.PlaneGeometry(20, 20);

  subroutine_geometry = new THREE.PlaneGeometry(editor_size.x, editor_size.y);

  node_mesh = [node_geometry, node_material];

  nib_mesh = [nib_geometry, node_material];

  subroutine_mesh = [subroutine_geometry, subroutine_material];

  make_box = function(name, mesh, text_size, position) {
    var box;
    box = new THREE.Object3D();
    box.add((function(func, args, ctor) {
      ctor.prototype = func.prototype;
      var child = new ctor, result = func.apply(child, args);
      return typeof result === "object" ? result : child;
    })(THREE.Mesh, mesh, function() {}));
    if (name) box.add(make_text(name, text_size));
    box.position = position.three();
    return box;
  };

  make_arrow = function(source, target, scoped) {
    var arrow, color, line, line_geometry, line_material;
    if (scoped == null) scoped = true;
    arrow = new THREE.Object3D();
    color = 0x888888;
    if ('three' in source) source = source.three();
    if ('three' in target) target = target.three();
    line_geometry = new THREE.Geometry();
    line_material = new THREE.LineBasicMaterial({
      color: color,
      linewidth: 3
    });
    line_geometry.vertices.push(new THREE.Vertex(source));
    line_geometry.vertices.push(new THREE.Vertex(target));
    line = new THREE.Line(line_geometry, line_material);
    if (scoped) current_scope.view.add(line);
    return line;
  };

  /* CORE HELPERS
  */

  ray_cast_mouse = function() {
    var forward, intersections, mouse, ray;
    mouse = mouse_coords(event).three();
    mouse.z = 1;
    forward = new THREE.Vector3(0, 0, -1);
    ray = new THREE.Ray(mouse, forward);
    intersections = ray.intersectScene(scene);
    if (intersections.length > 0) return (last(intersections)).object.parent;
  };

  mouse_coords = function(event) {
    return V(event.offsetX, editor_size.y - event.offsetY);
  };

  get_nib_position = function(nib) {
    if (nib.parent instanceof Node) {
      return Vector.from(nib.view.position).plus(nib.view.parent.position).three();
    } else {
      return Vector.from(nib.view.position).three();
    }
  };

  get_absolute_nib_position = function(nib) {
    return Vector.from(get_nib_position(nib)).plus(half_editor_size).three();
  };

  /* INTERACTION
  */

  dragging_object = null;

  connecting_object = null;

  dragging_offset = V(0, 0);

  highlighted_objects = {};

  highlight = function(node) {
    node.view.children[0].material = highlighted_node_material;
    return highlighted_objects[node.id] = node;
  };

  unhighlight = function(node) {
    node.view.children[0].material = node_material;
    return delete highlighted_objects[node.id];
  };

  unhighlight_all = function() {
    var id, obj, _results;
    _results = [];
    for (id in highlighted_objects) {
      obj = highlighted_objects[id];
      _results.push(unhighlight(obj));
    }
    return _results;
  };

  whitespace_split = function(input) {
    var results;
    results = input.split(/\s+/);
    if (results[0] === '') results = results.slice(1);
    return results;
  };

  valid_json = function(json) {
    try {
      return JSON.parse(json);
    } catch (exception) {
      if (exception instanceof SyntaxError) {
        alert("" + exception + " Invalid JSON: " + json);
        return false;
      } else {
        throw exception;
      }
    }
  };

  pretty_json = function(obj) {
    return JSON.stringify(obj, void 0, 2);
  };

  window.Controller = function($http) {
    var data, hide_subroutines, import_data, init_field, loaded_state, mouse_down, mouse_move, mouse_up, save_state, saving, start_saving, teardown_field,
      _this = this;
    init_field = function() {
      var field;
      if (!should_animate) {
        field = $("#field");
        field.append(renderer.domElement);
        should_animate = true;
        animate(field[0]);
        field.mousedown(mouse_down);
        field.mouseup(mouse_up);
        field.mousemove(mouse_move);
        return field.bind('contextmenu', function() {
          return false;
        });
      }
    };
    teardown_field = function() {
      return should_animate = false;
    };
    mouse_down = function(event) {
      var target;
      event.preventDefault();
      target = ray_cast_mouse();
      if (target) {
        if (target.model instanceof Node) {
          if (event.which === 3) {
            return target.model["delete"]();
          } else if (event.shiftKey) {
            return highlight(target.model);
          } else if (event.ctrlKey) {
            _this.edit(target.model.implementation);
            return _this.$digest();
          } else {
            return dragging_object = target;
          }
        } else if (target.model instanceof Nib) {
          if (event.which === 3) {
            return target.model.delete_connections();
          } else {
            system_arrow.geometry.vertices[0].position = system_arrow.geometry.vertices[1].position = get_absolute_nib_position(target.model);
            scene.add(system_arrow);
            return connecting_object = target;
          }
        } else {
          if (!event.shiftKey) return unhighlight_all();
        }
      }
    };
    mouse_up = function(event) {
      var connection, target;
      dragging_object = null;
      if (connecting_object) {
        target = ray_cast_mouse();
        if ((target != null ? target.model : void 0) instanceof Nib) {
          connection = make_connection(connecting_object, target);
        }
        connecting_object = null;
        return scene.remove(system_arrow);
      }
    };
    mouse_move = function(event) {
      var adjusted_vector, connection, delta, effected_nodes, id, mouse_vector, nib, node, original_position, vector, _i, _j, _len, _len2, _ref, _ref2;
      mouse_vector = mouse_coords(event);
      adjusted_vector = mouse_vector.minus(half_editor_size);
      vector = mouse_vector.three();
      if (dragging_object) {
        node = dragging_object.model;
        original_position = Vector.from(node.view.position);
        delta = adjusted_vector.minus(original_position);
        effected_nodes = node.id in highlighted_objects ? _.values(highlighted_objects) : [node];
        for (_i = 0, _len = effected_nodes.length; _i < _len; _i++) {
          node = effected_nodes[_i];
          node.set_position(Vector.from(node.position).plus(delta).three());
          _ref = node.get_nibs();
          for (_j = 0, _len2 = _ref.length; _j < _len2; _j++) {
            nib = _ref[_j];
            _ref2 = nib.connections;
            for (id in _ref2) {
              connection = _ref2[id];
              connection.vertex.position.copy(get_nib_position(nib));
            }
          }
        }
      }
      if (connecting_object) {
        return system_arrow.geometry.vertices[1].position = vector;
      }
    };
    hide_subroutines = function() {
      var index, subroutine, _ref, _results;
      _ref = _this.subroutines;
      _results = [];
      for (index in _ref) {
        subroutine = _ref[index];
        _results.push(scene.remove(subroutine.view));
      }
      return _results;
    };
    saving = false;
    start_saving = function() {
      if (!saving) return setInterval(save_state, 500);
    };
    this.log = function(expression) {
      return console.log(expression);
    };
    this.current_object = null;
    this.import_export_text = '';
    this.subroutines = {};
    this.builtins = {};
    this["import"] = function() {
      hide_subroutines();
      import_data(valid_source(this.import_export_text));
      if (current_scope) this.edit(current_scope);
      return start_saving();
    };
    import_data = function(source_data) {
      var builtin, data, id, subroutine, _ref, _ref2, _results;
      data = load_state(source_data);
      _ref = data.subroutines;
      for (id in _ref) {
        subroutine = _ref[id];
        _this.subroutines[subroutine.id] = subroutine;
      }
      _ref2 = data.builtins;
      _results = [];
      for (id in _ref2) {
        builtin = _ref2[id];
        _results.push(_this.builtins[builtin.id] = builtin);
      }
      return _results;
    };
    this.load_example_programs = function() {
      hide_subroutines();
      return $http.get('examples.json').success(function(source_data) {
        var playground;
        import_data(source_data);
        playground = new SubRoutine('playground');
        _this.subroutines[playground.id] = playground;
        _this.edit(playground);
        return start_saving();
      });
    };
    this.export_all = function() {
      var data;
      data = {
        subroutines: this.subroutines,
        builtins: this.builtins,
        schema_version: schema_version
      };
      return this.import_export_text = pretty_json(data);
    };
    this.export_subroutine = function(subroutine) {
      return _this.import_export_text = pretty_json(subroutine["export"]());
    };
    this.export_builtin = function(builtin) {
      return _this.import_export_text = pretty_json(builtin["export"]());
    };
    this.revert = function() {
      hide_subroutines();
      this.subroutines = {};
      this.builtins = {};
      return this.load_example_programs();
    };
    this.literal_text = '';
    this.use_literal = function() {
      if (valid_json(_this.literal_text)) {
        new Literal(V(0, 0), _this.literal_text);
        return _this.literal_text = '';
      }
    };
    this.use_builtin = function(builtin) {
      return new BuiltinApplication(V(0, 0), builtin);
    };
    this.use_subroutine = function(subroutine) {
      return new SubroutineApplication(V(0, 0), subroutine);
    };
    this.use_subroutine_value = function(subroutine) {
      return new Literal(V(0, 0), subroutine);
    };
    this.initial_subroutine = {
      name: '',
      inputs: [],
      outputs: []
    };
    this.new_subroutine = angular.copy(this.initial_subroutine);
    this.delete_subroutine = function(subroutine) {
      if (subroutine.id === current_scope.id) {
        _this.current_object = null;
        teardown_field();
      }
      return delete _this.subroutines[subroutine.id];
    };
    this.delete_builtin = function(builtin) {
      return delete _this.builtins[builtin.id];
    };
    this.add_subroutine = function() {
      var connection, contained_connections, id, in_connections, nib, node, out_connections, subroutine, _ref, _ref2, _ref3, _ref4;
      subroutine = new SubRoutine(_this.new_subroutine.name, _this.new_subroutine.inputs, _this.new_subroutine.outputs);
      in_connections = {};
      out_connections = {};
      for (id in highlighted_objects) {
        node = highlighted_objects[id];
        _ref = node.inputs;
        for (id in _ref) {
          nib = _ref[id];
          _ref2 = nib.connections;
          for (id in _ref2) {
            connection = _ref2[id];
            in_connections[connection.connection.id] = connection.connection;
          }
        }
        _ref3 = node.outputs;
        for (id in _ref3) {
          nib = _ref3[id];
          _ref4 = nib.connections;
          for (id in _ref4) {
            connection = _ref4[id];
            out_connections[connection.connection.id] = connection.connection;
          }
        }
      }
      contained_connections = {};
      for (id in in_connections) {
        connection = in_connections[id];
        if (connection.id in out_connections) {
          contained_connections[connection.id] = connection;
          delete in_connections[connection.id];
          delete out_connections[connection.id];
        }
      }
      for (id in contained_connections) {
        connection = contained_connections[id];
        current_scope.remove_connection(connection);
        subroutine.add_connection(connection);
      }
      for (id in in_connections) {
        connection = in_connections[id];
        connection["delete"]();
      }
      for (id in out_connections) {
        connection = out_connections[id];
        connection["delete"]();
      }
      for (id in highlighted_objects) {
        node = highlighted_objects[id];
        current_scope.remove_node(node);
        subroutine.add_node(node);
      }
      _this.subroutines[subroutine.id] = subroutine;
      _this.new_subroutine = angular.copy(_this.initial_subroutine);
      _this.new_subroutine.inputs = [];
      _this.new_subroutine.outputs = [];
      return _this.edit(subroutine);
    };
    this.add_builtin = function() {
      var builtin;
      builtin = new Builtin({});
      _this.builtins[builtin.id] = builtin;
      return _this.edit(builtin);
    };
    this.run_subroutine = function(subroutine, output_index) {
      var input, input_index, input_values, _fn, _len, _ref;
      input_values = [];
      _ref = subroutine.inputs;
      _fn = function(input_index, input) {
        var value;
        value = _.memoize(function() {
          var result;
          result = prompt("Provide a JSON value for input " + input_index + ": \"" + input.text + "\"");
          if (result === null) throw new Exit("cancelled execution");
          try {
            return JSON.parse(result);
          } catch (exception) {
            if (exception instanceof SyntaxError) {
              throw new InputError(result);
            } else {
              throw exception;
            }
          }
        });
        return input_values.push(value);
      };
      for (input_index = 0, _len = _ref.length; input_index < _len; input_index++) {
        input = _ref[input_index];
        _fn(input_index, input);
      }
      try {
        return setTimeout(subroutine.run(output_index, input_values));
      } catch (exception) {
        if (exception instanceof InputError) {
          return alert("Invalid JSON: " + exception.message);
        } else {
          throw exception;
        }
      }
    };
    this.run_builtin = function(builtin, output_index) {
      return execute(function() {
        var args, input, input_index, input_values, memo, memo_function, output_function, the_scope, _fn, _len, _ref;
        input_values = [];
        _ref = builtin.inputs;
        _fn = function(input_index, input) {
          return input_values.push(function() {
            return valid_json(prompt("Provide a JSON value for input " + input_index + ": \"" + input + "\""));
          });
        };
        for (input_index = 0, _len = _ref.length; input_index < _len; input_index++) {
          input = _ref[input_index];
          _fn(input_index, input);
        }
        the_scope = {
          memos: {}
        };
        try {
          memo_function = eval_expression(builtin.memo_implementation);
          output_function = eval_expression(builtin.output_implementation);
        } catch (exception) {
          if (exception instanceof SyntaxError) {
            throw new BuiltinSyntaxError(builtin.text, exception);
          } else {
            throw exception;
          }
        }
        if (!output_function) throw new NotImplemented(builtin.text);
        args = input_values.concat([output_index]);
        if (memo_function) memo = memo_function.apply(null, args);
        return output_function.apply(null, args.concat([memo]));
      });
    };
    this.edit = function(value) {
      _this.current_object = value;
      if (value instanceof SubRoutine) {
        current_scope = value;
        hide_subroutines();
        scene.add(value.view);
        setTimeout(init_field);
        return console.log(value.build_adjacency_list());
      } else {
        return teardown_field();
      }
    };
    save_state = function() {
      var state;
      state = {
        subroutines: _this.subroutines,
        builtins: _this.builtins,
        schema_version: schema_version
      };
      return localStorage.state = JSON.stringify(state);
    };
    this.builtins = all_builtins;
    system_arrow = make_arrow(V(0, 0), V(1, 0), false);
    if (localStorage.state != null) {
      data = JSON.parse(localStorage.state);
      loaded_state = load_state(data);
      this.builtins = loaded_state.builtins;
      this.subroutines = loaded_state.subroutines;
      current_scope = obj_first(this.subroutines);
      if (current_scope) this.edit(current_scope);
      return start_saving();
    } else {
      return this.load_example_programs();
    }
  };

  dissociate_exception = function(procedure) {
    try {
      return procedure();
    } catch (exception) {
      return setTimeout(function() {
        throw exception;
      });
    }
  };

  execute = function(routine) {
    try {
      return alert(JSON.stringify(routine()));
    } catch (exception) {
      if (exception instanceof RuntimeException) {
        return alert("Error: " + exception.message);
      } else {
        throw exception;
      }
    }
  };

  ignore_if_disconnected = function(procedure) {
    try {
      return procedure();
    } catch (exception) {
      if (!(exception instanceof NotConnected)) throw exception;
    }
  };

  load_state = function(data) {
    var builtin, builtin_data, builtins, id, subroutine, subroutine_data, subroutines, _ref, _ref2;
    subroutines = {};
    builtins = {};
    _ref = data.builtins;
    for (id in _ref) {
      builtin_data = _ref[id];
      builtin = new Builtin(builtin_data);
      builtins[builtin.id] = builtin;
    }
    _ref2 = data.subroutines;
    for (id in _ref2) {
      subroutine_data = _ref2[id];
      subroutine = new SubRoutine(subroutine_data.name, subroutine_data.inputs, subroutine_data.outputs, subroutine_data.id);
      subroutines[subroutine.id] = subroutine;
    }
    for (id in subroutines) {
      subroutine = subroutines[id];
      current_scope = subroutine;
      load_implementation(data.subroutines[id]);
    }
    return {
      subroutines: subroutines,
      builtins: builtins
    };
  };

  make_main = function() {
    return new SubRoutine('default', [], ['OUT']);
  };

  load_implementation = function(data) {
    var builtin, connection, node, position, sink, sink_connector, source, source_connector, subroutine, value, _i, _j, _len, _len2, _ref, _ref2, _results;
    _ref = data.nodes;
    for (_i = 0, _len = _ref.length; _i < _len; _i++) {
      node = _ref[_i];
      position = Vector.from(node.position);
      if (node.type === 'function') {
        subroutine = all_subroutines[node.implementation_id];
        if (subroutine) {
          new SubroutineApplication(position, subroutine, node.id);
        } else {
          new UnknownNode(position, node.type, node.text, node.id);
        }
      } else if (node.type === 'builtin') {
        builtin = all_builtins[node.implementation_id];
        if (builtin) {
          new BuiltinApplication(position, builtin, node.id);
        } else {
          new UnknownNode(position, node.type, node.text, node.id);
        }
      } else if (node.type === 'literal') {
        if ('implementation_id' in node) {
          subroutine = all_subroutines[node.implementation_id];
          value = subroutine;
        } else {
          value = node.text;
        }
        new Literal(position, value, node.id);
      }
    }
    _ref2 = data.connections;
    _results = [];
    for (_j = 0, _len2 = _ref2.length; _j < _len2; _j++) {
      connection = _ref2[_j];
      source = node_registry[connection.output.parent_id];
      sink = node_registry[connection.input.parent_id];
      source_connector = source instanceof Node ? source.outputs : source.inputs;
      sink_connector = sink instanceof Node ? sink.inputs : sink.outputs;
      if (connection.output.index >= source_connector.length || connection.input.index >= sink_connector.length) {
        _results.push(console.log("Oh no, trying to make an invalid connection"));
      } else {
        _results.push(source_connector[connection.output.index].connect(sink_connector[connection.input.index]));
      }
    }
    return _results;
  };

  playground_id = UUID();

}).call(this);
