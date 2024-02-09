import { AttachmentBuilder, BufferResolvable, ChatInputCommandInteraction, EmbedBuilder, PermissionsBitField, SlashCommandBuilder } from "discord.js";
import nodeHtmlToImage from "node-html-to-image";


// @ts-ignore


export default {
  data: new SlashCommandBuilder().setName("tabela").setDescription("Tabela do campeonato Brasileiro"),
  permissions: [
    PermissionsBitField.Flags.Connect,
    PermissionsBitField.Flags.Speak,
    PermissionsBitField.Flags.AddReactions,
    PermissionsBitField.Flags.ManageMessages
  ],
  async execute(interaction: ChatInputCommandInteraction) {
    const campeonato_id = 10;
    const key ="live_c39c54aacbf54e4010a8096e9275ed";


    await interaction.reply("⏳ Loading...").catch(console.error);

    try {

      const response =  await fetch(`https://api.api-futebol.com.br/v1/campeonatos/${campeonato_id}/tabela`,{
        headers:{
          "Authorization":`Bearer ${key}`
        }
      })
  
    
      const jsonData = await response.json();
   
      function criarModeloHTML(json:any) {
        let tabelaHTML = `
          <html>
            <head>
              <style>
                table {
                  width: 100%;
                  border-collapse: collapse;
                }
                th, td {
                  border: 1px solid black;
                  padding: 8px;
                  text-align: center;
                }
                th {
                  background-color: #ccc;
                }
                tr:nth-child(-n+4) {
                  background-color: lightgreen;
                }
                tr:nth-last-child(-n+4) {
                  background-color: #FF6347;
                }
                .avatar-cell {
                  display: flex;
                  align-items: center;
                }
                .avatar {
                  width: 30px;
                  height: 30px;
                  object-fit: cover;
                  border-radius: 50%;
                  margin-right: 8px;
                }
              </style>
            </head>
            <body>
              <h1>Tabela do Campeonato Brasileiro 2023</h1>
              <table>
                <tr>
                  <th>POS</th>
                  <th>Time</th>
                  <th>PTS</th>
                  <th>J</th>
                  <th>V</th>
                  <th>E</th>
                  <th>D</th>
                  <th>GP</th>
                  <th>GC</th>
                  <th>SG</th>
                  <th>%</th>
                  <th>Recentes</th>
                </tr>
        `;
      
        for (const item of json) {
          const pos = item.posicao || '';
          const time = item.time?.nome_popular || '';
          const pts = item.pontos || '';
          const jogos = item.jogos || '';
          const vitorias = item.vitorias || '';
          const empates = item.empates || '';
          const derrotas = item.derrotas || '';
          const golsPro = item.gols_pro || '';
          const golsContra = item.gols_contra || '';
          const saldoGols = item.saldo_gols || '';
          const aproveitamento = item.aproveitamento || '';
          const ultimosJogos = item.ultimos_jogos?.join('-').toUpperCase() || '';
          const escudo = item.time?.escudo || '';
      
          tabelaHTML += `
            <tr>
              <td>${pos}</td>
              <td class="avatar-cell">
                <img src="${escudo}" alt="Avatar" class="avatar">
                ${time}
              </td>
              <td>${pts}</td>
              <td>${jogos}</td>
              <td>${vitorias}</td>
              <td>${empates}</td>
              <td>${derrotas}</td>
              <td>${golsPro}</td>
              <td>${golsContra}</td>
              <td>${saldoGols}</td>
              <td>${aproveitamento}</td>
              <td>${ultimosJogos}</td>
            </tr>
          `;
        }
      
        tabelaHTML += `
              </table>
            </body>
          </html>
        `;
      
        return tabelaHTML;
      }
   
      
      const formatarTabela =criarModeloHTML(jsonData);
  
  
  
      const images = await nodeHtmlToImage({
        html: formatarTabela,
        quality: 100,
        type: 'jpeg',
      
        puppeteerArgs: {
          args: ['--no-sandbox'],
        },
      
      })
  
     
      
      
     let imagebuilder = new AttachmentBuilder(images as BufferResolvable)
  
      
  
     let tabelaok = new EmbedBuilder()
     .setTitle("Tabela Brasileirão 2024 - Jaqueline Futebolistica")
     .setColor("#F8AA2A")   
     .setTimestamp();
     
     
  
     return  interaction.editReply({content: "", embeds: [tabelaok], files:[imagebuilder]}).catch(console.error);
      
    } catch (error) {
      console.log(error)
      await interaction.reply("erro ao gerar a tabela...")
      
    }

  
}

};
