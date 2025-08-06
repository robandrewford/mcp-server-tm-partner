# MCP Server for Ticketmaster Partner API

[![smithery badge](https://smithery.ai/badge/@delorenj/mcp-server-tm-partner)](https://smithery.ai/server/@delorenj/mcp-server-tm-partner)

A Model Context Protocol server that provides tools for accessing the Ticketmaster Partner API, enabling discovery of events, venues, and attractions with enhanced filtering and data capabilities.

## Features

- **Comprehensive Search Capabilities**:
  - Events with date/time filtering and on-sale date ranges
  - Venues with geographic search (lat/long, radius)
  - Attractions with classification filtering
  - Support for specific ID lookups

- **Advanced Filtering Options**:
  - Keyword search
  - Date and time ranges (ISO 8601 format)
  - Location-based search (city, state, country, postal code)
  - Geographic radius search
  - Event classifications and categories
  - Market-specific searches

- **Flexible Output Formats**:
  - Structured JSON for programmatic use
  - Human-readable text format
  - Pagination support (up to 200 results per page)

## Installation

### Installing via Smithery

To install mcp-server-tm-partner for Claude Desktop automatically via [Smithery](https://smithery.ai/server/@delorenj/mcp-server-tm-partner):

```bash
npx -y @smithery/cli install @delorenj/mcp-server-tm-partner --client claude
```

### Manual Installation

```bash
npm install -g @delorenj/mcp-server-tm-partner
```

## Configuration

The server requires Ticketmaster Partner API credentials. To obtain these:

1. Visit [Ticketmaster Developer Portal](https://developer.ticketmaster.com/)
2. Sign up for a Partner API account (different from Discovery API)
3. Request Partner API access if not already granted
4. Obtain your API key and secret

Set your credentials in your MCP settings file:

```json
{
  "mcpServers": {
    "tm-partner": {
      "command": "npx",
      "args": ["-y", "@delorenj/mcp-server-tm-partner"],
      "env": {
        "TM_PARTNER_API_KEY": "your-partner-api-key",
        "TM_PARTNER_API_SECRET": "your-partner-api-secret"
      }
    }
  }
}
```

## Usage

The server provides a tool called `search_tm_partner` that accepts:

### Required Parameters

- `type`: Type of search ('event', 'venue', or 'attraction')

### Optional Parameters

#### General Search
- `keyword`: Search term
- `format`: Output format ('json' or 'text', defaults to 'json')
- `size`: Results per page (max 200, default 20)
- `page`: Page number (0-indexed)
- `sort`: Sort order for results

#### Event-Specific
- `eventId`: Specific event ID to retrieve
- `startDateTime`: Start date/time in ISO 8601 format
- `endDateTime`: End date/time in ISO 8601 format
- `attractionId`: Filter by attraction ID
- `venueId`: Filter by venue ID
- `classificationName`: Array of event categories
- `onsaleStartDateTime`: On-sale start date/time
- `onsaleEndDateTime`: On-sale end date/time

#### Location Parameters
- `city`: City name
- `stateCode`: State code (e.g., 'NY', 'CA')
- `countryCode`: Country code (e.g., 'US', 'CA')
- `postalCode`: Postal/ZIP code
- `latlong`: Latitude,longitude for geographic search
- `radius`: Search radius
- `unit`: Unit for radius ('miles' or 'km')
- `marketId`: Specific market ID

### Examples

#### Search for Events in a Date Range

```json
{
  "type": "event",
  "keyword": "concert",
  "startDateTime": "2025-02-01T00:00:00Z",
  "endDateTime": "2025-02-28T23:59:59Z",
  "city": "New York",
  "stateCode": "NY",
  "format": "text"
}
```

#### Find Venues Near a Location

```json
{
  "type": "venue",
  "latlong": "40.7128,-74.0060",
  "radius": "10",
  "unit": "miles",
  "size": 50
}
```

#### Get Specific Event Details

```json
{
  "type": "event",
  "eventId": "vvG1iZ4xGkdfJ",
  "format": "json"
}
```

#### Search Attractions by Classification

```json
{
  "type": "attraction",
  "classificationName": ["Music", "Rock"],
  "keyword": "band",
  "size": 100
}
```

## Development

1. Clone the repository:
   ```bash
   git clone https://github.com/delorenj/mcp-server-tm-partner.git
   cd mcp-server-tm-partner
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env` file with your credentials:
   ```
   TM_PARTNER_API_KEY=your-partner-api-key
   TM_PARTNER_API_SECRET=your-partner-api-secret
   ```

4. Build the project:
   ```bash
   npm run build
   ```

5. Test with the MCP Inspector:
   ```bash
   npm run inspector
   ```

## API Differences from Discovery API

The Partner API provides several advantages over the public Discovery API:

- **Enhanced Data Access**: More detailed event, venue, and attraction information
- **Higher Rate Limits**: Suitable for production applications
- **Additional Endpoints**: Access to partner-specific features
- **Priority Support**: Direct support channel for partners

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request. For major changes, please open an issue first to discuss what you would like to change.

## License

MIT License - see [LICENSE](LICENSE) file for details

## Support

For issues and questions:
- GitHub Issues: [https://github.com/delorenj/mcp-server-tm-partner/issues](https://github.com/delorenj/mcp-server-tm-partner/issues)
- Ticketmaster Partner Support: Available through your partner portal
