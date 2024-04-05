import { PrismaClient, Prisma } from '@prisma/client'
import { faker } from '@faker-js/faker'
import dayjs from 'dayjs'

const prisma = new PrismaClient()

interface AttendeeData {
  name: string;
  email: string;
  createdAt: Date;
  eventId: string;
  checkIn: Prisma.CheckInUncheckedCreateNestedOneWithoutAttendeeInput;
}

async function seed() {
  await prisma.event.deleteMany()

  // Criar 8 eventos
  for (let j = 0; j < 8; j++) {
    const eventId = faker.datatype.uuid()
    const maximumAttendees = faker.datatype.number({ min: 50, max: 200 })

    await prisma.event.create({
      data: {
        id: eventId,
        title: faker.lorem.words(3),
        slug: faker.lorem.slug(),
        details: faker.lorem.sentence(),
        maximumAttendees: maximumAttendees,
      }
    })

    // Verificar o número atual de participantes
    const currentAttendeesCount = await prisma.attendee.count({
      where: { eventId: eventId },
    })

    // Calcular o número de participantes restantes que podem ser adicionados
    const remainingAttendeesCount = maximumAttendees - currentAttendeesCount

    // Adicionar participantes para cada evento, limitando ao número máximo permitido
    const attendeesToInsertCount = Math.min(remainingAttendeesCount, 100) // Limite de 100 participantes por loop
    for (let i = 0; i < attendeesToInsertCount; i++) {
      await prisma.attendee.create({
        data: {
          name: faker.person.fullName(),
          email: faker.internet.email(),
          createdAt: faker.date.recent({ days: 30, refDate: dayjs().subtract(8, "days").toDate() }),
          eventId: eventId,
          checkIn: {
            create: {
              createdAt: faker.date.recent({ days: 7 }),
            }
          }
        }
      })
    }
  }
}

seed().then(() => {
  console.log('Database seeded!')
  prisma.$disconnect()
})
