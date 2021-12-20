"use strict";

function _typeof(obj) { "@babel/helpers - typeof"; return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (obj) { return typeof obj; } : function (obj) { return obj && "function" == typeof Symbol && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }, _typeof(obj); }

function ownKeys(object, enumerableOnly) { var keys = Object.keys(object); if (Object.getOwnPropertySymbols) { var symbols = Object.getOwnPropertySymbols(object); enumerableOnly && (symbols = symbols.filter(function (sym) { return Object.getOwnPropertyDescriptor(object, sym).enumerable; })), keys.push.apply(keys, symbols); } return keys; }

function _objectSpread(target) { for (var i = 1; i < arguments.length; i++) { var source = null != arguments[i] ? arguments[i] : {}; i % 2 ? ownKeys(Object(source), !0).forEach(function (key) { _defineProperty(target, key, source[key]); }) : Object.getOwnPropertyDescriptors ? Object.defineProperties(target, Object.getOwnPropertyDescriptors(source)) : ownKeys(Object(source)).forEach(function (key) { Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key)); }); } return target; }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

function createElement(type, props) {
  for (var _len = arguments.length, children = new Array(_len > 2 ? _len - 2 : 0), _key = 2; _key < _len; _key++) {
    children[_key - 2] = arguments[_key];
  }

  return {
    type: type,
    props: _objectSpread(_objectSpread({}, props), {}, {
      children: children.map(function (child) {
        return _typeof(child) === "object" ? child : createTextElement(child);
      })
    })
  };
}

function createTextElement(text) {
  return {
    type: "TEXT_ELEMENT",
    props: {
      nodeValue: text,
      children: []
    }
  };
}

function createDOMElement(fiber) {
  // create element
  var dom = fiber.type === "TEXT_ELEMENT" ? document.createTextNode("") : document.createElement(fiber.type); // assign properties(including event listeners)

  updateFiberDOM(dom, {}, fiber.props);
  return dom;
}

var Helpers = {
  isEvent: function isEvent(key) {
    return key.startsWith("on");
  },
  isProperty: function isProperty(key) {
    return key !== "children" && !Helpers.isEvent(key);
  },
  isNew: function isNew(prev, next) {
    return function (key) {
      return prev[key] !== next[key];
    };
  },
  wasRemoved: function wasRemoved(prev, next) {
    return function (key) {
      return !(key in next);
    };
  }
};

function updateFiberDOM(dom, prevProps, nextProps) {
  Object.keys(prevProps).forEach(function (name) {
    if (Helpers.isProperty(name)) {
      // remove old property if its not on the new fiber
      if (Helpers.wasRemoved(prevProps, nextProps)(name)) {
        dom[name] = "";
      }
    } else if (Helpers.isEvent(name)) {
      // remove old event listener if its not on the new fiber
      if (!(name in nextProps)) {
        if (Helpers.isNew(prevProps, nextProps)(name)) {
          var eventType = name.toLowerCase().substring(2);
          dom.removeEventListener(eventType, prevProps[name]);
        }
      }
    }
  });
  Object.keys(nextProps).forEach(function (name) {
    // add  new property
    if (Helpers.isProperty(name)) {
      if (Helpers.isNew(prevProps, nextProps)(name)) {
        dom[name] = nextProps[name];
      }
    } else if (Helpers.isEvent(name)) {
      // add new event listener
      if (Helpers.isNew(prevProps, nextProps)(name)) {
        var eventType = name.toLowerCase().substring(2);
        dom.addEventListener(eventType, nextProps[name]);
      }
    }
  });
}

function commitFiberTree() {
  deletions.forEach(commitFiberTreeToDOM);
  commitFiberTreeToDOM(fiberTreeRoot.child); // prepare for next render

  previousFiberTree = fiberTreeRoot;
  fiberTreeRoot = null;
}

function commitFiberTreeToDOM(fiber) {
  if (!fiber) {
    return;
  }

  var domParent = fiber.parent.dom;

  if (fiber.dom != null) {
    if (fiber.effectTag === "PLACEMENT") {
      // for a fiber that's completely new
      domParent.appendChild(fiber.dom);
    } else if (fiber.effectTag === "UPDATE") {
      // for a fiber that has a previous version
      updateFiberDOM(fiber.dom, fiber.previous.props, fiber.props);
    }
  } // for a fiber that's no longer needed


  if (fiber.effectTag === "DELETION") {
    domParent.removeChild(fiber.dom);
  }

  commitFiberTreeToDOM(fiber.child);
  commitFiberTreeToDOM(fiber.sibling);
}

function render(element, container) {
  // set fiber tree's root
  fiberTreeRoot = {
    dom: container,
    props: {
      children: [element]
    },
    previous: previousFiberTree
  };
  deletions = [];
  currentFiber = fiberTreeRoot;
}

var fiberTreeRoot = null;
var currentFiber = null;
var deletions = null;
var previousFiberTree = null;

function constructFiberTree(deadline) {
  var shouldYield = false; // if fiber tree's root is set, construct Fiber Tree fiber by fiber in the browser's idle time

  while (currentFiber && !shouldYield) {
    currentFiber = constructFiber(currentFiber);
    shouldYield = deadline.timeRemaining() < 1;
  }

  if (!currentFiber && fiberTreeRoot) {
    // when there are no more fiber's to be constructed
    commitFiberTree();
  }

  requestIdleCallback(constructFiberTree);
}

requestIdleCallback(constructFiberTree);

function constructFiber(fiber) {
  // add dom node 📦, in other words set fiber's dom element
  if (!fiber.dom) {
    fiber.dom = createDOMElement(fiber);
  } // create child fibers


  var children = fiber.props.children;
  reconcileChildren(fiber, children); // return next fiber: update currentFiber.

  if (fiber.child) {
    return fiber.child;
  } // otherwise, start moving towards the fiber root i.e. towards the 'parent'


  var nextFiber = fiber;

  while (nextFiber) {
    if (nextFiber.sibling) {
      return nextFiber.sibling;
    }

    nextFiber = nextFiber.parent;
  }
}

function reconcileChildren(wipFiber, children) {
  var index = 0; // if the fiber had a previous version, then get its previous version's child

  var oldFiber = wipFiber.previous && wipFiber.previous.child;
  var prevSibling = null;

  while (index < children.length || oldFiber != null) {
    var child = children[index];
    var newFiber = null;
    var isOfSameType = oldFiber && child && child.type === oldFiber.type;

    if (isOfSameType) {
      // create new fiber which points to its previous version
      newFiber = {
        type: oldFiber.type,
        props: child.props,
        dom: oldFiber.dom,
        parent: wipFiber,
        previous: oldFiber,
        effectTag: "UPDATE"
      };
    }

    if (child && !isOfSameType) {
      // create a completely new fiber
      newFiber = {
        type: child.type,
        props: child.props,
        dom: null,
        parent: wipFiber,
        previous: null,
        effectTag: "PLACEMENT"
      };
    }

    if (oldFiber && !isOfSameType) {
      // if the pevious version is no longer needed align it for deletion
      oldFiber.effectTag = "DELETION";
      deletions.push(oldFiber); // as its only comparing the type of fibers, it may leave out some oldfibers which need deletion
    }

    if (oldFiber) {
      // remember: fibers on the stem point to their immediate sibling
      // so the previous version of the next child is to going to be current child's previous version's sibling
      oldFiber = oldFiber.sibling;
    }

    if (index === 0) {
      wipFiber.child = newFiber;
    } else if (child) {
      // if this is not the first child, then the preceding child's fiber should point to the current child's fiber
      prevSibling.sibling = newFiber;
    } // note: prevSibling acts as a pointer(reference). 


    prevSibling = newFiber;
    index++;
  }
}

var Didact = {
  createElement: createElement,
  render: render
};
/** @jsx Didact.createElement */

var container = document.querySelector('#root');

var updateValue = function updateValue(event) {
  rerender(event.target.value);
};

var rerender = function rerender(value) {
  var element = Didact.createElement("div", null, Didact.createElement("input", {
    onInput: updateValue,
    value: value
  }), Didact.createElement("h2", null, "Hello ", value));
  Didact.render(element, container);
};

rerender("World!");
