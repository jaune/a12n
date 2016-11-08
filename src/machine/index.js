// ////////////////////////////////////////////////////////////////////////////

const CODE_EXIT = 0x81;

const CODE_CALL = 0x11;

const CODE_ADD = 0x01;
const CODE_SUBRACT = 0x02;

const CODE_PUSH_CONST = 0x02;

const CODE_FUNCTION_BEGIN = 0x20;
const CODE_FUNCTION_END = 0x21;

const CODE_BLOCK_BEGIN = 0x30;
const CODE_BLOCK_END = 0x31;

// ////////////////////////////////////////////////////////////////////////////

const TYPE_CODE_F64 = 0x50;
const TYPE_CODE_F32 = 0x40;

const TYPE_CODE_S64 = 0x31;
const TYPE_CODE_U64 = 0x30;
const TYPE_CODE_S32 = 0x21;
const TYPE_CODE_U32 = 0x20;
const TYPE_CODE_S16 = 0x11;
const TYPE_CODE_U16 = 0x10;
const TYPE_CODE_S8 = 0x01;
const TYPE_CODE_U8 = 0x00;

const TYPE_CODE_VOID = 0x80;

const TYPE_SIZE_F64 = 8;
const TYPE_SIZE_F32 = 4;
const TYPE_SIZE_S32 = 4;
const TYPE_SIZE_U32 = 4;
const TYPE_SIZE_S16 = 2;
const TYPE_SIZE_U16 = 2;
const TYPE_SIZE_S8 = 1;
const TYPE_SIZE_U8 = 1;


// ////////////////////////////////////////////////////////////////////////////

class Program {
  constructor () {
    this.buffer = Buffer.alloc(1024, 0);

    this.functions = {
      'void main()': {
        address: null
      }
    };

    var offset = 0;

    // function 666 void main()
    (() => {
      var symbol = 666;
      var parameters = [];
      var variables = [];

      this.functions['void main()'].address = offset;

      offset = this.buffer.writeUInt8(CODE_FUNCTION_BEGIN, offset);
      offset = this.buffer.writeUInt16LE(symbol, offset);
      offset = this.buffer.writeUInt8(TYPE_CODE_VOID, offset);

      offset = this.buffer.writeUInt16LE(parameters.length, offset);
      parameters.forEach((parameter) => {
        offset = this.buffer.writeUInt8(parameter.type, offset);
      });

      offset = this.buffer.writeUInt16LE(variables.length, offset);
      variables.forEach((variable) => {
        offset = this.buffer.writeUInt8(variable.type, offset);
      });
      offset = this.buffer.writeUInt8(CODE_FUNCTION_END, offset);
    })();


    // program entry
    this.begin_offset = offset;

    // block
    (() => {
      var variables = [{
        type: TYPE_CODE_U8
      }];

      offset = this.buffer.writeUInt8(CODE_BLOCK_BEGIN, offset);
      offset = this.buffer.writeUInt16LE(variables.length, offset);
      variables.forEach((variable) => {
        offset = this.buffer.writeUInt8(variable.type, offset);
      });
    })();

    // call void main()
    (() => {
      var address = this.functions['void main()'].address;
      var parameters = [];

      offset = this.buffer.writeUInt8(CODE_CALL, offset);
      offset = this.buffer.writeUInt16LE(address, offset);
      offset = this.buffer.writeUInt16LE(parameters.length, offset);
      parameters.forEach((parameter) => {
        offset = this.buffer.writeUInt8(parameter.type, offset);
      });
    })();

    // push_const s32 1
    offset = this.buffer.writeUInt8(CODE_PUSH_CONST, offset);
    offset = this.buffer.writeUInt8(TYPE_CODE_S32, offset);
    offset = this.buffer.writeInt32LE(1, offset);

    // exit
    offset = this.buffer.writeUInt8(CODE_EXIT, offset);

    offset = this.buffer.writeUInt8(CODE_BLOCK_END, offset);

    this.offset = offset;
  }
}


class Machine {

  constructor () {
    this.memory = Buffer.alloc(1024, 0);

    this.contexts = [];
    this.currentContext = null;

    this.exitCode = null;
  }

// ////////////////////////////////////////////////////////////////////////////

  popValue (type) {
    var value;
    let ctx = this.currentContext;

    switch (type) {
      case TYPE_CODE_U32: ctx.stack_pointer -= TYPE_SIZE_U32; value = this.memory.readUInt32LE(ctx.stack_pointer); break;
      case TYPE_CODE_S32: ctx.stack_pointer -= TYPE_SIZE_S32; value = this.memory.readInt32LE(ctx.stack_pointer); break;
      case TYPE_CODE_U16: ctx.stack_pointer -= TYPE_SIZE_U16; value = this.memory.readUInt16LE(ctx.stack_pointer); break;
      case TYPE_CODE_S16: ctx.stack_pointer -= TYPE_SIZE_S16; value = this.memory.readInt16LE(ctx.stack_pointer); break;
      case TYPE_CODE_U8: ctx.stack_pointer -= TYPE_SIZE_U8; value = this.memory.readUInt8(ctx.stack_pointer); break;
      case TYPE_CODE_S8: ctx.stack_pointer -= TYPE_SIZE_S8; value = this.memory.readInt8(ctx.stack_pointer); break;
      default:
        throw new Error('Invalid type `0x' + type.toString(16) + '` !');
    }

    return value;
  }


  pushValue (type, value) {
    let ctx = this.currentContext;

    console.log('push', value);

    switch (type) {
      case TYPE_CODE_U32: ctx.stack_pointer = this.memory.writeUInt32LE(value, ctx.stack_pointer); break;
      case TYPE_CODE_S32: ctx.stack_pointer = this.memory.writeInt32LE(value, ctx.stack_pointer); break;
      case TYPE_CODE_U16: ctx.stack_pointer = this.memory.writeUInt16LE(value, ctx.stack_pointer); break;
      case TYPE_CODE_S16: ctx.stack_pointer = this.memory.writeInt16LE(value, ctx.stack_pointer); break;
      case TYPE_CODE_U8: ctx.stack_pointer = this.memory.writeInt8(value, ctx.stack_pointer); break;
      case TYPE_CODE_S8: ctx.stack_pointer = this.memory.writeUInt8(value, ctx.stack_pointer); break;
      default:
        throw new Error('Invalid type `0x' + type.toString(16) + '` !');
    }
  }

// ////////////////////////////////////////////////////////////////////////////

  readValue (type) {
    let value;
    let ctx = this.currentContext;

    // read value
    switch (type) {
      case TYPE_CODE_U32: value = this.memory.readUInt32LE(ctx.code_pointer); ctx.code_pointer += TYPE_SIZE_U32; break;
      case TYPE_CODE_S32: value = this.memory.readInt32LE(ctx.code_pointer); ctx.code_pointer += TYPE_SIZE_S32; break;
      case TYPE_CODE_U16: value = this.memory.readUInt16LE(ctx.code_pointer); ctx.code_pointer += TYPE_SIZE_U16; break;
      case TYPE_CODE_S16: value = this.memory.readInt16LE(ctx.code_pointer); ctx.code_pointer += TYPE_SIZE_S16; break;
      case TYPE_CODE_U8: value = this.memory.readUInt8(ctx.code_pointer); ctx.code_pointer += TYPE_SIZE_U8; break;
      case TYPE_CODE_S8: value = this.memory.readInt8(ctx.code_pointer); ctx.code_pointer += TYPE_SIZE_S8; break;
      default:
        throw new Error('Invalid type `0x' + type.toString(16) + '` !');
    }

    return value;
  }

  readSize() {
    let value = this.memory.readUInt16LE(this.currentContext.code_pointer);

    ctx.code_pointer += TYPE_SIZE_U16;

    return value;
  }

  readType() {
    let value = this.memory.readUInt8(this.currentContext.code_pointer);

    ctx.code_pointer += TYPE_SIZE_U8;

    return value;
  }

// ////////////////////////////////////////////////////////////////////////////

  step () {
    let ctx = this.currentContext;

    if (ctx.code_pointer >= ctx.code[1]) {
      throw new Error('Out of range !');
    }

    var inst = this.memory.readUInt8(ctx.code_pointer);
    ctx.code_pointer += 1;

    switch (inst) {
      case CODE_BLOCK_BEGIN:
        // read variables size
        var variables_size = this.readSize();
        var variables = [];

        for (let i = 0; i < variables_size; i++) {
          variables.push({
            type: this.readType()
          });
        }
        break;

      case CODE_PUSH_CONST:
        // read type
        let type = this.readType();

        this.pushValue(type, this.readValue(type));
        break;

      case CODE_EXIT:
        this.exitCode = this.popValue(TYPE_CODE_S32);
        break;

      default:
        throw new Error('Missing instruction `0x' + inst.toString(16)  + '` !');
    }
  }

  start (program, args) {
    args = args || [];

    // copy program in memory
    program.buffer.copy(this.memory, 0, 0, program.offset);

    let context = {
      code: [0, program.offset],
      code_size: program.offset,
      code_pointer: program.begin_offset,

      data: [program.offset, program.offset],
      data_size: 0,
      static: [program.offset, program.offset],
      static_size: 0,

      stack: program.offset,
      stack_pointer: program.offset,
    };

    this.contexts.push(context);
    this.currentContext = context;
  }
}

// ////////////////////////////////////////////////////////////////////////////

var p = new Program();

var m = new Machine();

m.start(p, []);

while (m.exitCode === null) {
  m.step();
}

console.log(m.exitCode);