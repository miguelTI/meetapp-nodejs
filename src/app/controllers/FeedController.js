import { Op } from 'sequelize';
import { parseISO, startOfHour, addHours, endOfDay, addDays } from 'date-fns';
import Meetup from '../models/Meetup';
import File from '../models/File';
import User from '../models/User';
import Attendance from '../models/Attendance';

class FeedController {
  async index(req, res) {
    const { date, page = 1 } = req.query;

    const minimumDate = addHours(startOfHour(parseISO(date)), 1);
    // const maximumDate = addDays(minimumDate, 1);
    const maximumDate = endOfDay(parseISO(date));

    const meetups = await Meetup.findAll({
      order: [['date', 'ASC']],
      include: [
        {
          model: File,
          as: 'avatar',
          attributes: ['id', 'path', 'url'],
        },
        {
          model: User,
          as: 'user',
          attributes: ['id', 'name'],
        },
        {
          model: Attendance,
          required: false,
          as: 'attendance',
          attributes: ['id'],
          where: {
            user_id: req.userId,
          },
        },
      ],
      where: {
        date: {
          [Op.between]: [minimumDate, maximumDate],
        },
        user_id: {
          [Op.not]: req.userId,
        },
      },
      offset: (page - 1) * 10,
    });

    return res.json(meetups);
  }
}

export default new FeedController();
