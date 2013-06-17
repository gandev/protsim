Control.create('TelegramForm', {
  extend: FormEnhanced,

  onSubmit: function (fields, form) {
    console.log(fields);

    Meteor.call("updateTelegram", Session.get("protocol_selected"), Session.get("telegram_selected_def"), _.values(fields));

    form.reset();
  }
});

////////// Helpers for in-place editing //////////

// Returns an event map that handles the "escape" and "return" keys and
// "blur" events on a text input (given by selector) and interprets them
// as "ok" or "cancel".
var okCancelEvents = function(selector, callbacks) {
  var ok = callbacks.ok || function() {};
  var cancel = callbacks.cancel || function() {};

  var events = {};
  events['keyup ' + selector + ', keydown ' + selector + ', focusout ' + selector] = function(evt) {
    if (evt.type === "keydown" && evt.which === 27) {
      // escape = cancel
      cancel.call(this, evt);

    } else if (evt.type === "keyup" && evt.which === 13 ||
      evt.type === "focusout") {
      // blur/return/enter = ok/submit if non-empty
      var value = String(evt.target.value || "");
      if (value)
        ok.call(this, value, evt);
      else
        cancel.call(this, evt);
    }
  };

  return events;
};

var activateInput = function(input) {
  input.focus();
  input.select();
};

Session.set("protocol_selected", false);
Session.set("telegram_selected_def", false);

//constant values


//************* protdef Template *************

Template.protdef.helpers({
  equal: function(a, b) {
    return a == b;
  },

  value_types: function() {
    return [
        "String",
        "UInt8",
        "UInt16LE",
        "UInt16BE",
        "UInt32LE",
        "UInt32BE",
        "Int8",
        "Int16LE",
        "Int16BE",
        "Int32LE",
        "Int32BE",
        "FloatLE",
        "FloatBE",
        "DoubleLE",
        "DoubleBE"];
  },

  protdef: function() {
    return Protdef.find();
  },

  selected_protocol: function() {
    return Session.equals("protocol_selected", this._id) ? 'selected' : '';
  },

  selected_telegram: function() {
    return Session.equals("telegram_selected_def", this._id) ? 'selected' : '';
  },

  protocol: function() {
    return Protdef.findOne({
      _id: Session.get("protocol_selected")
    });
  },

  telegram: function(protocol) {
    var telegrams = protocol.telegrams;
    for (var i = 0; i < telegrams.length; i++) {
      var telegram = telegrams[i];
      if (Session.equals("telegram_selected_def", telegram._id)) {
        return telegram;
      }
    }
  }
});

Template.protdef.events({
  'click .protocol': function() {
    var protocol = this;
    if (!Session.equals("protocol_selected", protocol._id)) {
      Session.set("protocol_selected", protocol._id);
      Session.set("telegram_selected_def", null);
    }
  },

  'click .telegram': function() {
    var telegram = this;
    Session.set("telegram_selected_def", telegram._id);
  },

  'click .add_protocol': function() {
    Meteor.call("saveProtocol", new Protocol());
  },

  'click .remove_protocol': function() {
    var protocol = this;
    var watch = Protwatch.findOne({
      _id: protocol._id
    });
    if (watch) {
      Meteor.call("endWatch", protocol._id);
    }
    Protdef.remove({
      _id: protocol._id
    });
  }
});

//************* interface Template *************

Template.interface.helpers({
  editing_local_port: function() {
    return Session.equals("editing_local_port", this._id) ? true : false;
  },

  editing_remote_port: function() {
    return Session.equals("editing_remote_port", this._id) ? true : false;
  },

  editing_remote_ip: function() {
    return Session.equals("editing_remote_ip", this._id) ? true : false;
  }
});

Template.interface.events({
  'dblclick .display_local_port': function(evt, tmpl) {
    Session.set('editing_local_port', this._id);
    Deps.flush(); // update DOM before focus
    activateInput(tmpl.find("#" + this._id + "_local_port"));
  },

  'dblclick .display_remote_port': function(evt, tmpl) {
    Session.set('editing_remote_port', this._id);
    Deps.flush(); // update DOM before focus
    activateInput(tmpl.find("#" + this._id + "_remote_port"));
  },

  'dblclick .display_remote_ip': function(evt, tmpl) {
    Session.set('editing_remote_ip', this._id);
    Deps.flush(); // update DOM before focus
    activateInput(tmpl.find("#" + this._id + "_remote_ip"));
  }
});

Template.interface.events(okCancelEvents(
  '.edit_local_port', {
  ok: function(value) {
    Protdef.update({
      _id: Session.get("protocol_selected")
    }, {
      '$set': {
        'interface.transport.local_port': value
      }
    });
    Session.set('editing_local_port', null);
  },

  cancel: function() {
    Session.set('editing_local_port', null);
  }
}));

Template.interface.events(okCancelEvents(
  '.edit_remote_port', {
  ok: function(value) {
    Protdef.update({
      _id: Session.get("protocol_selected")
    }, {
      '$set': {
        'interface.transport.remote_port': value
      }
    });
    Session.set('editing_remote_port', null);
  },

  cancel: function() {
    Session.set('editing_remote_port', null);
  }
}));

Template.interface.events(okCancelEvents(
  '.edit_remote_ip', {
  ok: function(value) {
    Protdef.update({
      _id: Session.get("protocol_selected")
    }, {
      '$set': {
        'interface.transport.remote_ip': value
      }
    });
    Session.set('editing_remote_ip', null);
  },

  cancel: function() {
    Session.set('editing_remote_ip', null);
  }
}));