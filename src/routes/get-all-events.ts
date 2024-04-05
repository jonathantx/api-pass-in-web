import { FastifyInstance } from "fastify";
import { ZodTypeProvider } from "fastify-type-provider-zod";
import { z } from "zod";
import { prisma } from "../lib/prisma";
import { BadRequest } from "./_errors/bad-request";

export async function getAllEvent(app: FastifyInstance) {
  app
    .withTypeProvider<ZodTypeProvider>()
    .get('/events', {
      schema: {
        summary: 'Get events',
        tags: ['events'],
        querystring: z.object({
          title: z.string().optional(),
          slug: z.string().optional(),
          details: z.string().optional(),
          maximumAttendees: z.number().int().nullable().optional(),
        }),
        response: {
          200: z.array(z.object({
            id: z.string().uuid(),
            title: z.string(),
            slug: z.string(),
            details: z.string().nullable(),
            maximumAttendees: z.number().int().nullable(),
            attendeesAmount: z.number().int(),
          })),
        },
      }
    }, async (request, reply) => {
      const { title, slug, details, maximumAttendees } = request.query

      const events = await prisma.event.findMany({
        select: {
          id: true,
          title: true,
          slug: true,
          details: true,
          maximumAttendees: true,
          _count: {
            select: {
              attendees: true,
            }
          },
        },
        where: {
          title: { contains: title },
          slug: { contains: slug },
          details: { contains: details },
          maximumAttendees: maximumAttendees !== undefined ? { equals: maximumAttendees } : undefined,
        }
      })

      return reply.send(events.map(event => ({
        id: event.id,
        title: event.title,
        slug: event.slug,
        details: event.details,
        maximumAttendees: event.maximumAttendees,
        attendeesAmount: event._count.attendees,
      })))
    })
}
