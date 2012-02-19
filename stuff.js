(function() {
  var Connection, FunctionApplication, Input, Literal, Nib, Node, Output, animate, boxes, camera, connecting_object, dragging_object, dragging_offset, evaluate_program, execute_program, functions, get_nib_position, height, input_nodes, last, make_arrow, make_box, make_connection, make_nib_view, make_node, make_node_view, mouse_coords, mouse_down, mouse_move, mouse_up, output_nodes, program_outputs, projector, ray_cast_mouse, renderer, scene, system_arrow, update, width;
  var __hasProp = Object.prototype.hasOwnProperty, __extends = function(child, parent) {
    for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; }
    function ctor() { this.constructor = child; }
    ctor.prototype = parent.prototype;
    child.prototype = new ctor;
    child.__super__ = parent.prototype;
    return child;
  };
  height = window.innerHeight;
  width = window.innerWidth;
  camera = new THREE.OrthographicCamera(0, width, height, 0, -2000, 1000);
  scene = new THREE.Scene();
  scene.add(camera);
  renderer = new THREE.CanvasRenderer();
  renderer.setSize(width, height);
  projector = new THREE.Projector();
  boxes = {};
  input_nodes = {};
  output_nodes = {};
  update = function() {
    return renderer.render(scene, camera);
  };
  animate = function() {
    requestAnimationFrame(animate);
    return update();
  };
  functions = {
    '+': {
      inputs: ['L', 'R'],
      outputs: ['R'],
      definition: function(left, right) {
        return left() + right();
      }
    },
    '-': {
      inputs: ['L', 'R'],
      outputs: ['R'],
      definition: function(left, right) {
        return left() - right();
      }
    },
    'out': {
      inputs: ['I'],
      outputs: [],
      definition: function(input) {
        return console.log(input());
      }
    },
    'if': {
      inputs: ['T', 'C', 'F'],
      outputs: ['R'],
      definition: function(true_result, condition, false_result) {
        if (condition()) {
          return true_result();
        } else {
          return false_result();
        }
      }
    },
    'die': {
      inputs: [],
      outputs: ['R'],
      definition: function() {
        return console.log("OH NO!");
      }
    },
    'prompt': {
      inputs: ['M'],
      outputs: ['R'],
      definition: function(message) {
        return prompt(message());
      }
    },
    '=': {
      inputs: ['L', 'R'],
      outputs: ['R'],
      definition: function(left, right) {
        return left() === right();
      }
    }
  };
  last = function(list) {
    return list[list.length - 1];
  };
  evaluate_program = function(nib) {
    var data, input, input_values, _fn, _i, _len, _ref;
    data = nib.parent.data;
    if (data.data_type === 'literal') {
      return data.value;
    }
    if (data.data_type === 'function') {
      input_values = [];
      _ref = data.inputs;
      _fn = function(input) {
        return input_values.push(function() {
          var _ref2;
          nib = (_ref2 = input.data.connections[0]) != null ? _ref2.nib : void 0;
          if (!nib) {
            throw "NotConnected";
          }
          return evaluate_program(nib);
        });
      };
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        input = _ref[_i];
        _fn(input);
      }
      return data.value.apply(null, input_values);
    }
  };
  program_outputs = [];
  execute_program = function() {
    var nib, output_function, result, _i, _len, _results;
    _results = [];
    for (_i = 0, _len = program_outputs.length; _i < _len; _i++) {
      output_function = program_outputs[_i];
      _results.push((function() {
        var _ref;
        try {
          nib = (_ref = output_function.data.inputs[0].data.connections[0]) != null ? _ref.nib : void 0;
          if (!nib) {
            throw "NotConnected";
          }
          result = evaluate_program(nib);
          console.log(result);
          return alert(result);
        } catch (exception) {
          if (exception === "NotConnected") {
            return alert("Your program is not fully connected");
          } else {
            throw exception;
          }
        }
      })());
    }
    return _results;
  };
  make_node = function(text, position) {
    var as_number, box, information, value, _ref;
    if (position == null) {
      position = V(250, 250);
    }
    if ((text[0] === last(text)) && ((_ref = text[0]) === "'" || _ref === '"')) {
      value = text.slice(1, text.length - 1);
      return new Literal(position, text, value);
    } else {
      as_number = parseFloat(text);
      if (!isNaN(as_number)) {
        return new Literal(position, text, as_number);
      } else if (text in functions) {
        information = functions[text];
        box = new FunctionApplication(position, text, information);
        if (text === 'out') {
          return program_outputs.push(box);
        }
      }
    }
  };
  Node = (function() {
    function Node() {
      this.view = make_node_view(this);
    }
    return Node;
  })();
  FunctionApplication = (function() {
    function FunctionApplication(position, text, information) {
      var index, text;
      this.position = position;
      this.text = text;
      this.value = information.definition;
      FunctionApplication.__super__.constructor.call(this);
      this.inputs = (function() {
        var _len, _ref, _results;
        _ref = information.inputs;
        _results = [];
        for (index = 0, _len = _ref.length; index < _len; index++) {
          text = _ref[index];
          _results.push(new Input(this, text, index, information.inputs.length - 1));
        }
        return _results;
      }).call(this);
      this.outpus = (function() {
        var _len, _ref, _results;
        _ref = information.outputs;
        _results = [];
        for (index = 0, _len = _ref.length; index < _len; index++) {
          text = _ref[index];
          _results.push(new Output(this, text, index, information.outputs.length - 1));
        }
        return _results;
      }).call(this);
    }
    __extends(FunctionApplication, Node);
    return FunctionApplication;
  })();
  Literal = (function() {
    function Literal(position, text, value) {
      this.position = position;
      this.text = text;
      this.value = value;
      Literal.__super__.constructor.call(this);
      this.inputs = [];
      this.outpus = new Output(this, 'O');
    }
    __extends(Literal, Node);
    return Literal;
  })();
  Nib = (function() {
    function Nib() {
      this.view = make_nib_view(this);
    }
    return Nib;
  })();
  Input = (function() {
    function Input(node, text, index, siblings) {
      this.node = node;
      this.text = text;
      this.index = index != null ? index : 0;
      this.siblings = siblings != null ? siblings : 0;
      this.type = 'input';
      Input.__super__.constructor.call(this);
    }
    __extends(Input, Nib);
    return Input;
  })();
  Output = (function() {
    function Output(node, text, index, siblings) {
      this.node = node;
      this.text = text;
      this.index = index != null ? index : 0;
      this.siblings = siblings != null ? siblings : 0;
      this.type = 'output';
      Output.__super__.constructor.call(this);
    }
    __extends(Output, Nib);
    return Output;
  })();
  Connection = (function() {
    function Connection(input, output) {
      this.input = input;
      this.output = output;
    }
    return Connection;
  })();
  make_node_view = function(node) {
    var color, main_box, main_box_size;
    main_box_size = V(50, 50);
    color = 0x888888;
    main_box = make_box(node.text, main_box_size, 10, color, node.position);
    main_box.model = node;
    scene.add(main_box);
    return boxes[main_box.id] = main_box;
  };
  make_nib_view = function(nib) {
    var parent, sub_box, sub_box_color, sub_box_size, x_position, y_offset, y_position;
    sub_box_size = V(20, 20);
    sub_box_color = 0x888888;
    y_offset = 20;
    x_position = -20 + 40 * nib.index / nib.siblings;
    y_position = y_offset * (nib.type === 'input' ? 1 : -1);
    sub_box = make_box(nib.text, sub_box_size, 5, sub_box_color, V(x_position, y_position));
    sub_box.model = nib;
    parent = nib.node.view;
    return parent.add(sub_box);
  };
  /* CORE RENDERING */
  make_box = function(name, size, text_size, color, position) {
    var box, centerOffset, geometry, material, mesh, text, text_color, text_geometry;
    box = new THREE.Object3D();
    geometry = (function(func, args, ctor) {
      ctor.prototype = func.prototype;
      var child = new ctor, result = func.apply(child, args);
      return typeof result === "object" ? result : child;
    })(THREE.PlaneGeometry, size.components(), function() {});
    material = new THREE.MeshBasicMaterial({
      color: color
    });
    mesh = new THREE.Mesh(geometry, material);
    mesh.position = V(0, 0).three();
    box.add(mesh);
    text_geometry = new THREE.TextGeometry(name, {
      size: text_size,
      font: 'helvetiker',
      curveSegments: 2
    });
    text_geometry.computeBoundingBox();
    centerOffset = -0.5 * (text_geometry.boundingBox.x[1] - text_geometry.boundingBox.x[0]);
    text_color = new THREE.MeshBasicMaterial({
      color: 0x000000,
      overdraw: true
    });
    text = new THREE.Mesh(text_geometry, text_color);
    text.position.x = centerOffset;
    box.position = position.three();
    box.add(text);
    return box;
  };
  make_arrow = function(source, target) {
    var arrow, color, line, line_geometry, line_material;
    arrow = new THREE.Object3D();
    color = 0x888888;
    if ('three' in source) {
      source = source.three();
    }
    if ('three' in target) {
      target = target.three();
    }
    line_geometry = new THREE.Geometry();
    line_material = new THREE.LineBasicMaterial({
      color: color,
      lineWidth: 1
    });
    line_geometry.vertices.push(new THREE.Vertex(source));
    line_geometry.vertices.push(new THREE.Vertex(target));
    line = new THREE.Line(line_geometry, line_material);
    scene.add(line);
    return line;
  };
  ray_cast_mouse = function() {
    var forward, intersections, mouse, ray;
    mouse = mouse_coords(event).three();
    mouse.z = 1;
    forward = new THREE.Vector3(0, 0, -1);
    ray = new THREE.Ray(mouse, forward);
    intersections = ray.intersectObjects(_.values(boxes));
    if (intersections.length > 0) {
      return (last(intersections)).object.parent;
    }
  };
  get_nib_position = function(nib) {
    return Vector.from(nib.position).plus(nib.parent.position).three();
  };
  /* INTERACTION */
  system_arrow = make_arrow(V(0, 0), V(1, 0));
  scene.remove(system_arrow);
  make_node('out', V(200, 100));
  mouse_coords = function(event) {
    return V(event.clientX, height - event.clientY);
  };
  dragging_object = null;
  connecting_object = null;
  dragging_offset = V(0, 0);
  mouse_up = function(event) {
    var target;
    dragging_object = null;
    if (connecting_object) {
      target = ray_cast_mouse();
      if ((target != null ? target.data.type : void 0) === 'input' || (target != null ? target.data.type : void 0) === 'output') {
        make_connection(connecting_object, target);
      }
      connecting_object = null;
      return scene.remove(system_arrow);
    }
  };
  make_connection = function(source, target) {
    var arrow;
    arrow = make_arrow(get_nib_position(source), get_nib_position(target));
    /*
        # don't allow double-connections at an input
        input = if source.data.type is 'input' then source else target
        if input.data.connections.length
            connection = input.data.connections[0]
            scene.remove connection.arrow
            input.data.connections = []
            # NOTE: leaves the hanging source connection =[
            # NOTE: oh shit we don't really have a handle on the object.  Just a vertex.
        */
    source.data.connections.push({
      nib: target,
      arrow: arrow.geometry.vertices[0]
    });
    return target.data.connections.push({
      nib: source,
      arrow: arrow.geometry.vertices[1]
    });
  };
  mouse_down = function(event) {
    var target;
    target = ray_cast_mouse();
    if (target) {
      if (target.model instanceof Node) {
        return dragging_object = target;
      } else if (target.model instanceof Nib) {
        system_arrow.geometry.vertices[0].position = system_arrow.geometry.vertices[1].position = get_nib_position(target);
        scene.add(system_arrow);
        return connecting_object = target;
      }
    }
  };
  mouse_move = function(event) {
    var connection, nib, vector, _i, _j, _len, _len2, _ref, _ref2;
    vector = mouse_coords(event).three();
    if (dragging_object) {
      dragging_object.position.copy(vector);
      _ref = dragging_object.data.nibs;
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        nib = _ref[_i];
        _ref2 = nib.data.connections;
        for (_j = 0, _len2 = _ref2.length; _j < _len2; _j++) {
          connection = _ref2[_j];
          connection.arrow.position.copy(get_nib_position(nib));
        }
      }
    }
    if (connecting_object) {
      return system_arrow.geometry.vertices[1].position = vector;
    }
  };
  $(function() {
    var field, node_form, node_input, run_button;
    field = $("#field");
    node_form = $('#add_node');
    node_input = $('#node_name');
    run_button = $('#run_button');
    field.append(renderer.domElement);
    animate();
    field.mousedown(mouse_down);
    field.mouseup(mouse_up);
    field.mousemove(mouse_move);
    node_form.submit(function(event) {
      var node_name;
      event.preventDefault();
      node_name = node_input.val();
      node_input.val('');
      return make_node(node_name);
    });
    run_button.click(function(event) {
      event.preventDefault();
      event.stopPropagation();
      return execute_program();
    });
    return field.click(function(event) {});
  });
}).call(this);
