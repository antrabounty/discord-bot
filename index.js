const mySecret = process.env['TOKEN']
const { Client, MessageEmbed } = require('discord.js');
const config = require('./config');
const commands = require('./help');

let bot = new Client({
  fetchAllMembers: true, // Remove this if the bot is in large guilds.
  presence: {
    status: 'online',
    activity: {
      name: `${config.prefix}aled`,
      type: 'Informations ='
    }
  }
});

bot.on('ready', () => console.log(`Logged in as ${bot.user.tag}.`));

bot.on('message', function(msg){
    if((msg.content.includes("tapa")) && !msg.content.includes("raciste")) {
        msg.channel.send('TUCK FAPA');
    }
});

bot.on('message', function(msg){
    if(msg.content.includes("dog")){
        msg.reply('Oui maître');
    }
});

bot.on('message', function(msg){
    if(msg.content.includes("arabe" || "arabes")){
        msg.channel.send('Tous les mêmes');
    }
});

bot.on('message', function(msg){
    if((msg.content.includes("tapa")) && (msg.content.includes("raciste"))){
        msg.channel.send('Oui je suis raciste');
    }
});

bot.on('message', function(msg){
    if((msg.content.includes("bonne nuit")) || (msg.content.includes("bn"))){
        msg.channel.send('Bonne nuit mon ptit loup');
    }
});

bot.on('message', message => {
    var prefix = '-'
    var msg = message.content;

    if (msg === prefix + 'sus') {
        message.channel.send("tapa KAWAIII", {
            files: [
                "./Snapchat-1907678836.jpg"
            ]
        });
    }
});


bot.on('message', message => {
    var prefix = '-'
    var msg = message.content;

    if (msg === prefix + 'meme') {
        message.channel.send("'J'ai mon propre gameplay'", {
            files: [
                "./memetapa.png"
            ]
        });
    }
});

bot.on('message', message => {
    var prefix = '-'
    var msg = message.content;

    if (msg === prefix + 'fr') {
        message.channel.send('"Je coné mieu la langue que toi"', {
            files: [
                "./Snapchat-47280282yfgu.jpg"
            ]
        });
    }
});

bot.on('message', message => {
    var prefix = '-'
    var msg = message.content;

    if (msg === prefix + 'fire') {
        message.channel.send(':fire: :fire: :fire: :sunglasses: :fire: :fire: :fire:', {
            files: [
                "./Snapchat-1920235841.jpg"
            ]
        });
    }
});

bot.on('message', async message => {
  // Check for command
  if (message.content.startsWith(config.prefix)) {
    let args = message.content.slice(config.prefix.length).split(' ');
    let command = args.shift().toLowerCase();

    switch (command) {

      case 'ping':
        let msg = await message.reply('Ponging...');
        await msg.edit(`92I criminel pas chinois`)
        break;

      case 'weedometer':
        let msgg = await message.reply('Calcul...');
        var r_text = new Array ();
            r_text[0] = (":red_square: 20% Sobre ?")
            r_text[1] = (":orange_square: :orange_square: 40% C'est la hess les shabs.")
            r_text[2] = (":yellow_square: :yellow_square: :yellow_square: 60% J'ai arrêté hier.")
            r_text[3] = (":green_square: :green_square: :green_square: :green_square: 80% les enfants.")
            r_text[4] = (":blue_square: :blue_square: :blue_square: :blue_square: :blue_square: 100% et c'est dla bonne chakalito !")

            var i = Math.floor(r_text.length * Math.random());
            await msgg.edit(r_text[i]);
            break;

      /* Unless you know what you're doing, don't change this command. */
      case 'aled':
        let embed =  new MessageEmbed()
          .setTitle('LES CONSEILS DE TAPA')
          .setColor('RED')
          .setFooter(`Demandé par le bouf: ${message.member ? message.member.displayName : message.author.username}`, message.author.displayAvatarURL())
          .setThumbnail(bot.user.displayAvatarURL());
        if (!args[0])
          embed
            .setDescription(Object.keys(commands).map(command => `\`${command.padEnd(Object.keys(commands).reduce((a, b) => b.length > a.length ? b : a, '').length)}\` :: ${commands[command].description}`).join('\n'));
        else {
          if (Object.keys(commands).includes(args[0].toLowerCase()) || Object.keys(commands).map(c => commands[c].aliases || []).flat().includes(args[0].toLowerCase())) {
            let command = Object.keys(commands).includes(args[0].toLowerCase())? args[0].toLowerCase() : Object.keys(commands).find(c => commands[c].aliases && commands[c].aliases.includes(args[0].toLowerCase()));
            embed
              .setTitle(`COMMAND - ${command}`)

            if (commands[command].aliases)
              embed.addField('Command aliases', `\`${commands[command].aliases.join('`, `')}\``);
            embed
              .addField('DESCRIPTION', commands[command].description)
              .addField('FORMAT', `\`\`\`${config.prefix}${commands[command].format}\`\`\``);
          } else {
            embed
              .setColor('RED')
              .setDescription('This command does not exist. Please use the help command without specifying any commands to list them all.');
          }
        }
        message.channel.send(embed);
        break;
    }
  }
});

require('./server')();
bot.login(process.env.TOKEN);