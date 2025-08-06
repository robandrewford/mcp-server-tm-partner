#!/usr/bin/env node

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ErrorCode,
  ListToolsRequestSchema,
  McpError,
} from '@modelcontextprotocol/sdk/types.js';
import axios, { AxiosInstance } from 'axios';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Ticketmaster Partner API configuration
const TM_PARTNER_API_KEY = process.env.TM_PARTNER_API_KEY;
const TM_PARTNER_API_SECRET = process.env.TM_PARTNER_API_SECRET;
const TM_PARTNER_BASE_URL = 'https://app.ticketmaster.com/partners/v2';

if (!TM_PARTNER_API_KEY || !TM_PARTNER_API_SECRET) {
  console.error('Missing required environment variables: TM_PARTNER_API_KEY and/or TM_PARTNER_API_SECRET');
  process.exit(1);
}

// Types for Partner API responses
interface PartnerEvent {
  id: string;
  name: string;
  type: string;
  url: string;
  locale: string;
  images?: Array<{
    url: string;
    width: number;
    height: number;
    fallback: boolean;
  }>;
  dates?: {
    start?: {
      localDate?: string;
      localTime?: string;
      dateTime?: string;
    };
    timezone?: string;
    status?: {
      code: string;
    };
  };
  sales?: {
    public?: {
      startDateTime?: string;
      endDateTime?: string;
    };
  };
  priceRanges?: Array<{
    type: string;
    currency: string;
    min: number;
    max: number;
  }>;
  _embedded?: {
    venues?: Array<PartnerVenue>;
    attractions?: Array<PartnerAttraction>;
  };
}

interface PartnerVenue {
  id: string;
  name: string;
  type: string;
  url: string;
  locale: string;
  timezone?: string;
  city?: {
    name: string;
  };
  state?: {
    name: string;
    stateCode: string;
  };
  country?: {
    name: string;
    countryCode: string;
  };
  address?: {
    line1: string;
    line2?: string;
  };
  location?: {
    longitude: string;
    latitude: string;
  };
}

interface PartnerAttraction {
  id: string;
  name: string;
  type: string;
  url: string;
  locale: string;
  images?: Array<{
    url: string;
    width: number;
    height: number;
    fallback: boolean;
  }>;
  classifications?: Array<{
    primary: boolean;
    segment?: {
      id: string;
      name: string;
    };
    genre?: {
      id: string;
      name: string;
    };
    subGenre?: {
      id: string;
      name: string;
    };
  }>;
}

class TicketmasterPartnerAPIClient {
  private axiosInstance: AxiosInstance;

  constructor() {
    // Create axios instance with auth headers
    this.axiosInstance = axios.create({
      baseURL: TM_PARTNER_BASE_URL,
      headers: {
        'Accept': 'application/json',
      },
      auth: {
        username: TM_PARTNER_API_KEY!,
        password: TM_PARTNER_API_SECRET!,
      },
    });
  }

  async searchEvents(params: {
    keyword?: string;
    attractionId?: string;
    venueId?: string;
    postalCode?: string;
    latlong?: string;
    radius?: string;
    unit?: string;
    source?: string;
    locale?: string;
    marketId?: string;
    startDateTime?: string;
    endDateTime?: string;
    size?: number;
    page?: number;
    sort?: string;
    onsaleStartDateTime?: string;
    onsaleEndDateTime?: string;
    city?: string;
    countryCode?: string;
    stateCode?: string;
    classificationName?: string[];
    classificationId?: string[];
  }): Promise<any> {
    const response = await this.axiosInstance.get('/events', { params });
    return response.data;
  }

  async getEvent(id: string, params?: { locale?: string }): Promise<any> {
    const response = await this.axiosInstance.get(`/events/${id}`, { params });
    return response.data;
  }

  async searchVenues(params: {
    keyword?: string;
    locale?: string;
    size?: number;
    page?: number;
    sort?: string;
    city?: string;
    countryCode?: string;
    stateCode?: string;
    postalCode?: string;
    latlong?: string;
    radius?: string;
    unit?: string;
  }): Promise<any> {
    const response = await this.axiosInstance.get('/venues', { params });
    return response.data;
  }

  async getVenue(id: string, params?: { locale?: string }): Promise<any> {
    const response = await this.axiosInstance.get(`/venues/${id}`, { params });
    return response.data;
  }

  async searchAttractions(params: {
    keyword?: string;
    locale?: string;
    size?: number;
    page?: number;
    sort?: string;
    classificationName?: string[];
    classificationId?: string[];
  }): Promise<any> {
    const response = await this.axiosInstance.get('/attractions', { params });
    return response.data;
  }

  async getAttraction(id: string, params?: { locale?: string }): Promise<any> {
    const response = await this.axiosInstance.get(`/attractions/${id}`, { params });
    return response.data;
  }
}

// Format functions
function formatEventAsText(event: PartnerEvent): string {
  const lines = [`Event: ${event.name} (ID: ${event.id})`];
  
  if (event.dates?.start) {
    const date = event.dates.start.localDate || 'TBD';
    const time = event.dates.start.localTime || 'TBD';
    lines.push(`Date/Time: ${date} at ${time}`);
  }
  
  if (event._embedded?.venues && event._embedded.venues.length > 0) {
    const venue = event._embedded.venues[0];
    lines.push(`Venue: ${venue.name}`);
    if (venue.city?.name) {
      lines.push(`Location: ${venue.city.name}${venue.state ? ', ' + venue.state.stateCode : ''}`);
    }
  }
  
  if (event.priceRanges && event.priceRanges.length > 0) {
    const range = event.priceRanges[0];
    lines.push(`Price Range: $${range.min} - $${range.max} ${range.currency}`);
  }
  
  if (event.url) {
    lines.push(`URL: ${event.url}`);
  }
  
  return lines.join('\n');
}

function formatVenueAsText(venue: PartnerVenue): string {
  const lines = [`Venue: ${venue.name} (ID: ${venue.id})`];
  
  if (venue.address?.line1) {
    lines.push(`Address: ${venue.address.line1}`);
  }
  
  if (venue.city?.name) {
    const location = [venue.city.name];
    if (venue.state?.stateCode) location.push(venue.state.stateCode);
    if (venue.country?.countryCode) location.push(venue.country.countryCode);
    lines.push(`Location: ${location.join(', ')}`);
  }
  
  if (venue.url) {
    lines.push(`URL: ${venue.url}`);
  }
  
  return lines.join('\n');
}

function formatAttractionAsText(attraction: PartnerAttraction): string {
  const lines = [`Attraction: ${attraction.name} (ID: ${attraction.id})`];
  
  if (attraction.classifications && attraction.classifications.length > 0) {
    const primary = attraction.classifications.find(c => c.primary) || attraction.classifications[0];
    const classInfo = [];
    if (primary.segment?.name) classInfo.push(primary.segment.name);
    if (primary.genre?.name) classInfo.push(primary.genre.name);
    if (classInfo.length > 0) {
      lines.push(`Classification: ${classInfo.join(' - ')}`);
    }
  }
  
  if (attraction.url) {
    lines.push(`URL: ${attraction.url}`);
  }
  
  return lines.join('\n');
}

// Initialize server
const server = new Server(
  {
    name: 'mcp-server-tm-partner',
    version: '0.1.0',
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// Initialize API client
const apiClient = new TicketmasterPartnerAPIClient();

// Register tool handlers
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: 'search_tm_partner',
        description: 'Search for events, venues, or attractions using Ticketmaster Partner API',
        inputSchema: {
          type: 'object',
          properties: {
            type: {
              type: 'string',
              enum: ['event', 'venue', 'attraction'],
              description: 'Type of search to perform',
            },
            keyword: {
              type: 'string',
              description: 'Search keyword or term',
            },
            eventId: {
              type: 'string',
              description: 'Specific event ID to retrieve',
            },
            venueId: {
              type: 'string',
              description: 'Specific venue ID to search or retrieve',
            },
            attractionId: {
              type: 'string',
              description: 'Specific attraction ID to search or retrieve',
            },
            startDateTime: {
              type: 'string',
              description: 'Start date/time in ISO 8601 format (YYYY-MM-DDTHH:mm:ssZ)',
            },
            endDateTime: {
              type: 'string',
              description: 'End date/time in ISO 8601 format (YYYY-MM-DDTHH:mm:ssZ)',
            },
            city: {
              type: 'string',
              description: 'City name',
            },
            stateCode: {
              type: 'string',
              description: 'State code (e.g., NY, CA)',
            },
            countryCode: {
              type: 'string',
              description: 'Country code (e.g., US, CA)',
            },
            postalCode: {
              type: 'string',
              description: 'Postal/ZIP code',
            },
            latlong: {
              type: 'string',
              description: 'Latitude,longitude for geographic search',
            },
            radius: {
              type: 'string',
              description: 'Search radius',
            },
            unit: {
              type: 'string',
              enum: ['miles', 'km'],
              description: 'Unit for radius (miles or km)',
            },
            classificationName: {
              type: 'array',
              items: {
                type: 'string',
              },
              description: 'Event classification/category names',
            },
            size: {
              type: 'number',
              description: 'Number of results per page (max 200)',
              default: 20,
            },
            page: {
              type: 'number',
              description: 'Page number (0-indexed)',
              default: 0,
            },
            sort: {
              type: 'string',
              description: 'Sort order for results',
            },
            format: {
              type: 'string',
              enum: ['json', 'text'],
              description: 'Output format (defaults to json)',
              default: 'json',
            },
          },
          required: ['type'],
        },
      },
    ],
  };
});

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    if (name === 'search_tm_partner') {
      const {
        type,
        keyword,
        eventId,
        venueId,
        attractionId,
        startDateTime,
        endDateTime,
        city,
        stateCode,
        countryCode,
        postalCode,
        latlong,
        radius,
        unit,
        classificationName,
        size = 20,
        page = 0,
        sort,
        format = 'json',
      } = args as any;

      let results: any;

      if (type === 'event') {
        if (eventId) {
          // Get specific event
          results = await apiClient.getEvent(eventId);
        } else {
          // Search events
          results = await apiClient.searchEvents({
            keyword,
            attractionId,
            venueId,
            postalCode,
            latlong,
            radius,
            unit,
            startDateTime,
            endDateTime,
            size,
            page,
            sort,
            city,
            countryCode,
            stateCode,
            classificationName,
          });
        }
      } else if (type === 'venue') {
        if (venueId && !keyword) {
          // Get specific venue
          results = await apiClient.getVenue(venueId);
        } else {
          // Search venues
          results = await apiClient.searchVenues({
            keyword,
            size,
            page,
            sort,
            city,
            countryCode,
            stateCode,
            postalCode,
            latlong,
            radius,
            unit,
          });
        }
      } else if (type === 'attraction') {
        if (attractionId && !keyword) {
          // Get specific attraction
          results = await apiClient.getAttraction(attractionId);
        } else {
          // Search attractions
          results = await apiClient.searchAttractions({
            keyword,
            size,
            page,
            sort,
            classificationName,
          });
        }
      } else {
        throw new McpError(
          ErrorCode.InvalidParams,
          `Invalid search type: ${type}. Must be 'event', 'venue', or 'attraction'.`
        );
      }

      // Format output based on requested format
      if (format === 'text') {
        let textOutput = '';
        
        if (results._embedded) {
          // Handle search results
          if (results._embedded.events) {
            textOutput = results._embedded.events
              .map((event: PartnerEvent) => formatEventAsText(event))
              .join('\n\n---\n\n');
          } else if (results._embedded.venues) {
            textOutput = results._embedded.venues
              .map((venue: PartnerVenue) => formatVenueAsText(venue))
              .join('\n\n---\n\n');
          } else if (results._embedded.attractions) {
            textOutput = results._embedded.attractions
              .map((attraction: PartnerAttraction) => formatAttractionAsText(attraction))
              .join('\n\n---\n\n');
          }
        } else {
          // Handle single item results
          if (type === 'event') {
            textOutput = formatEventAsText(results);
          } else if (type === 'venue') {
            textOutput = formatVenueAsText(results);
          } else if (type === 'attraction') {
            textOutput = formatAttractionAsText(results);
          }
        }
        
        return {
          content: [
            {
              type: 'text',
              text: textOutput || 'No results found.',
            },
          ],
        };
      } else {
        // Return JSON format
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(results, null, 2),
            },
          ],
        };
      }
    } else {
      throw new McpError(ErrorCode.MethodNotFound, `Unknown tool: ${name}`);
    }
  } catch (error: any) {
    if (error.response) {
      throw new McpError(
        ErrorCode.InternalError,
        `Ticketmaster Partner API error: ${error.response.status} - ${error.response.data?.message || error.response.statusText}`
      );
    } else if (error.request) {
      throw new McpError(
        ErrorCode.InternalError,
        'No response from Ticketmaster Partner API'
      );
    } else {
      throw new McpError(
        ErrorCode.InternalError,
        `Error: ${error.message}`
      );
    }
  }
});

// Start the server
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('Ticketmaster Partner API MCP Server running on stdio');
}

main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
