package hostlife

import (
	"github.com/maxzz/win-watch-26/backend/winapp"
	"github.com/maxzz/win-watch-26/backend/winlaunch"
)

func (c *Controller) GetRunElevated() bool {
	if c.store == nil {
		return false
	}
	return c.store.RunElevated()
}

func (c *Controller) SetRunElevated(value bool) error {
	if c.store == nil {
		return nil
	}
	return c.store.SetRunElevated(value)
}

func (c *Controller) IsElevated() bool {
	return winlaunch.IsElevated()
}

func (c *Controller) GetQuitOnClose() bool {
	if c.store == nil {
		return false
	}
	return c.store.QuitOnClose()
}

func (c *Controller) SetQuitOnClose(value bool) error {
	if c.store == nil {
		return nil
	}
	return c.store.SetQuitOnClose(value)
}

func (c *Controller) GetShowInTaskbar() bool {
	if c.store == nil {
		return true
	}
	return c.store.ShowInTaskbar()
}

func (c *Controller) SetShowInTaskbar(value bool) error {
	if c.store == nil {
		return nil
	}
	if err := c.store.SetShowInTaskbar(value); err != nil {
		return err
	}
	winapp.SetShowInTaskbar(value)
	return nil
}
