import { JwParser } from './JwParser.js'
import { JabkoParser } from './JabkoParser.js'

export class ParserFactory {
  static createParser(type, config = {}) {
    switch (type.toLowerCase()) {
      case 'jw':
        return new JwParser(config)
      case 'jabko':
        return new JabkoParser(config)
      default:
        throw new Error(`Unknown parser type: ${type}`)
    }
  }
}
