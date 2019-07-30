import Sequelize, { Model } from 'sequelize';

class File extends Model {
  static init(sequelize) {
    const appUrl =
      process.env.NODE_ENV === 'development'
        ? `${process.env.APP_URL}:${process.env.PORT}`
        : process.env.APP_URL;
    super.init(
      {
        name: Sequelize.STRING,
        path: Sequelize.STRING,
        url: {
          type: Sequelize.VIRTUAL,
          get() {
            return `${appUrl}/files/${this.path}`;
          },
        },
      },
      {
        sequelize,
      }
    );

    return this;
  }
}

export default File;
