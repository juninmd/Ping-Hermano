using System;
using System.Windows.Forms;

namespace PingHermano
{
    public partial class Form1 : Form
    {
        public Form1()
        {
            InitializeComponent();
        }

        private void btnInternet_Click(object sender, EventArgs e)
        {
            new formInternet().Show();
        }
    }
}
