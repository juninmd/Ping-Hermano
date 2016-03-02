using PingHermano.Core;
using System;
using System.Windows.Forms;

namespace PingHermano
{
    public partial class formInternet : Form
    {
        public int CaiuAlgumaVez { get; set; }
        public formInternet()
        {
            InitializeComponent();
            CaiuAlgumaVez = 0;
            timer1.Enabled = true;
            Check();
        }

        private void timer1_Tick(object sender, EventArgs e) { Check(); }
        private void Check()
        {
            label1.Text = "Checando";

            var requestNet = new InternetCore().Ping();
            label1.Text = "OK";

            if (requestNet.IsSuccess)
            {
                txtStatus.Text = requestNet.Message;
                return;
            }


            if (CaiuAlgumaVez == 0)
            {
                txtStatus.Text = "Eitaaa, caiu a net!!";
                return;
            }

            txtStatus.Text = requestNet.Message;

        }

    }
}
